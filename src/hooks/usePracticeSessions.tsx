import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  PracticeSession,
  PracticeSessionSection,
  PracticeSessionItem,
  SessionWithDetails,
} from '@/types/sessions';
import { toast } from '@/hooks/use-toast';

const SESSIONS_TABLE = 'practice_sessions';
const SECTIONS_TABLE = 'practice_session_sections';
const ITEMS_TABLE = 'practice_session_items';
const SHARES_TABLE = 'practice_session_shares';

function estimateDuration(sections: { items: PracticeSessionItem[] }[], breakEnabled: boolean, breakSeconds: number): number {
  let total = 0;
  let itemCount = 0;
  for (const sec of sections) {
    for (const item of sec.items) {
      if (item.item_type === 'pause') {
        total += item.duration_seconds || 60;
      } else if (item.duration_mode === 'timer' && item.duration_seconds) {
        total += item.duration_seconds;
      } else {
        total += 180; // estimate 3min for videos
      }
      itemCount++;
    }
  }
  if (breakEnabled && itemCount > 1) {
    total += (itemCount - 1) * breakSeconds;
  }
  return total;
}

export function usePracticeSessions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['practice-sessions', user?.id],
    queryFn: async (): Promise<SessionWithDetails[]> => {
      if (!user) return [];
      const { data: sessions, error } = await (supabase as any)
        .from(SESSIONS_TABLE)
        .select('*')
        .eq('owner_user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map((s: any) => s.id);
      const { data: sections } = await (supabase as any)
        .from(SECTIONS_TABLE)
        .select('*')
        .in('session_id', sessionIds)
        .order('order_index');
      const { data: items } = await (supabase as any)
        .from(ITEMS_TABLE)
        .select('*')
        .in('session_id', sessionIds)
        .order('order_index');

      return sessions.map((s: any) => {
        const secs = (sections || [])
          .filter((sec: any) => sec.session_id === s.id)
          .map((sec: any) => ({
            ...sec,
            items: (items || []).filter((it: any) => it.section_id === sec.id),
          }));
        const itemCount = secs.reduce((a: number, sec: any) => a + sec.items.length, 0);
        return {
          ...s,
          sections: secs,
          itemCount,
          estimatedDuration: estimateDuration(secs, s.break_enabled, s.break_seconds_default),
        } as SessionWithDetails;
      });
    },
    enabled: !!user,
  });

  const createSession = useMutation({
    mutationFn: async (data: {
      name: string;
      break_enabled: boolean;
      break_seconds_default: number;
      sections: { title: string; section_key: string; items: Omit<PracticeSessionItem, 'id' | 'session_id' | 'section_id' | 'created_at'>[] }[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: session, error } = await (supabase as any)
        .from(SESSIONS_TABLE)
        .insert({
          owner_user_id: user.id,
          name: data.name,
          break_enabled: data.break_enabled,
          break_seconds_default: data.break_seconds_default,
        })
        .select()
        .single();
      if (error) throw error;

      for (let si = 0; si < data.sections.length; si++) {
        const sec = data.sections[si];
        const { data: sectionRow, error: secErr } = await (supabase as any)
          .from(SECTIONS_TABLE)
          .insert({
            session_id: session.id,
            title: sec.title,
            section_key: sec.section_key,
            order_index: si,
          })
          .select()
          .single();
        if (secErr) throw secErr;

        if (sec.items.length > 0) {
          const itemRows = sec.items.map((item, ii) => ({
            session_id: session.id,
            section_id: sectionRow.id,
            order_index: ii,
            item_type: item.item_type,
            ref_id: item.ref_id,
            title_cache: item.title_cache,
            duration_mode: item.duration_mode,
            duration_seconds: item.duration_seconds,
          }));
          const { error: itemErr } = await (supabase as any)
            .from(ITEMS_TABLE)
            .insert(itemRows);
          if (itemErr) throw itemErr;
        }
      }
      return session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice-sessions'] });
    },
  });

  const updateSession = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      break_enabled: boolean;
      break_seconds_default: number;
      sections: { id?: string; title: string; section_key: string; items: (Omit<PracticeSessionItem, 'id' | 'session_id' | 'section_id' | 'created_at'> & { id?: string })[] }[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      // Update session
      const { error } = await (supabase as any)
        .from(SESSIONS_TABLE)
        .update({ name: data.name, break_enabled: data.break_enabled, break_seconds_default: data.break_seconds_default })
        .eq('id', data.id);
      if (error) throw error;

      // Delete old sections + items (cascade)
      await (supabase as any).from(SECTIONS_TABLE).delete().eq('session_id', data.id);

      // Re-insert
      for (let si = 0; si < data.sections.length; si++) {
        const sec = data.sections[si];
        const { data: sectionRow, error: secErr } = await (supabase as any)
          .from(SECTIONS_TABLE)
          .insert({ session_id: data.id, title: sec.title, section_key: sec.section_key, order_index: si })
          .select()
          .single();
        if (secErr) throw secErr;

        if (sec.items.length > 0) {
          const itemRows = sec.items.map((item, ii) => ({
            session_id: data.id,
            section_id: sectionRow.id,
            order_index: ii,
            item_type: item.item_type,
            ref_id: item.ref_id,
            title_cache: item.title_cache,
            duration_mode: item.duration_mode,
            duration_seconds: item.duration_seconds,
          }));
          await (supabase as any).from(ITEMS_TABLE).insert(itemRows);
        }
      }
      return data.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice-sessions'] });
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(SESSIONS_TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice-sessions'] });
      toast({ title: 'Session gelöscht' });
    },
  });

  const duplicateSession = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error('Not authenticated');
      const session = sessionsQuery.data?.find(s => s.id === sessionId);
      if (!session) throw new Error('Session not found');

      return createSession.mutateAsync({
        name: `${session.name} (Kopie)`,
        break_enabled: session.break_enabled,
        break_seconds_default: session.break_seconds_default,
        sections: session.sections.map(sec => ({
          title: sec.title,
          section_key: sec.section_key,
          items: sec.items.map(it => ({
            order_index: it.order_index,
            item_type: it.item_type,
            ref_id: it.ref_id,
            title_cache: it.title_cache,
            duration_mode: it.duration_mode,
            duration_seconds: it.duration_seconds,
          })),
        })),
      });
    },
    onSuccess: () => {
      toast({ title: 'Session dupliziert' });
    },
  });

  const generateShareSlug = useCallback(async (sessionId: string) => {
    const slug = `s-${sessionId.slice(0, 8)}-${Date.now().toString(36)}`;
    await (supabase as any)
      .from(SESSIONS_TABLE)
      .update({ is_public: true, share_slug: slug })
      .eq('id', sessionId);
    qc.invalidateQueries({ queryKey: ['practice-sessions'] });
    return slug;
  }, [qc]);

  const fetchSessionBySlug = useCallback(async (slug: string): Promise<SessionWithDetails | null> => {
    const { data: sessions } = await (supabase as any)
      .from(SESSIONS_TABLE)
      .select('*')
      .eq('share_slug', slug)
      .eq('is_public', true)
      .limit(1);
    if (!sessions || sessions.length === 0) return null;
    const s = sessions[0];
    const { data: sections } = await (supabase as any)
      .from(SECTIONS_TABLE)
      .select('*')
      .eq('session_id', s.id)
      .order('order_index');
    const { data: items } = await (supabase as any)
      .from(ITEMS_TABLE)
      .select('*')
      .eq('session_id', s.id)
      .order('order_index');
    const secs = (sections || []).map((sec: any) => ({
      ...sec,
      items: (items || []).filter((it: any) => it.section_id === sec.id),
    }));
    return {
      ...s,
      sections: secs,
      itemCount: secs.reduce((a: number, sec: any) => a + sec.items.length, 0),
      estimatedDuration: estimateDuration(secs, s.break_enabled, s.break_seconds_default),
    };
  }, []);

  const fetchSessionById = useCallback(async (id: string): Promise<SessionWithDetails | null> => {
    const { data: sessions } = await (supabase as any)
      .from(SESSIONS_TABLE)
      .select('*')
      .eq('id', id)
      .limit(1);
    if (!sessions || sessions.length === 0) return null;
    const s = sessions[0];
    const { data: sections } = await (supabase as any)
      .from(SECTIONS_TABLE)
      .select('*')
      .eq('session_id', s.id)
      .order('order_index');
    const { data: items } = await (supabase as any)
      .from(ITEMS_TABLE)
      .select('*')
      .eq('session_id', s.id)
      .order('order_index');
    const secs = (sections || []).map((sec: any) => ({
      ...sec,
      items: (items || []).filter((it: any) => it.section_id === sec.id),
    }));
    return {
      ...s,
      sections: secs,
      itemCount: secs.reduce((a: number, sec: any) => a + sec.items.length, 0),
      estimatedDuration: estimateDuration(secs, s.break_enabled, s.break_seconds_default),
    };
  }, []);

  const markUsed = useCallback(async (id: string) => {
    await (supabase as any)
      .from(SESSIONS_TABLE)
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', id);
  }, []);

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    createSession,
    updateSession,
    deleteSession,
    duplicateSession,
    generateShareSlug,
    fetchSessionBySlug,
    fetchSessionById,
    markUsed,
  };
}
