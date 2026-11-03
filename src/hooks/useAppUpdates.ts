import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppUpdate, countUnread, GUEST_READS_KEY, readGuestIds } from '@/lib/news';

export function useAppUpdates() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from('app_updates').select('*').order('created_at', { ascending: false }).limit(30);
      if (!alive) return;
      setUpdates((data as AppUpdate[]) ?? []);
      if (user) {
        const { data: reads } = await supabase.from('app_update_reads').select('update_id').eq('user_id', user.id);
        if (alive) setReadIds((reads ?? []).map((r) => r.update_id));
      } else {
        setReadIds(readGuestIds());
      }
    })();
    return () => { alive = false; };
  }, [user]);

  const markAllRead = useCallback(async () => {
    const unread = updates.filter((u) => !readIds.includes(u.id)).map((u) => u.id);
    if (!unread.length) return;
    const next = [...readIds, ...unread];
    setReadIds(next);
    if (user) {
      await supabase.from('app_update_reads').upsert(unread.map((id) => ({ user_id: user.id, update_id: id })), { onConflict: 'user_id,update_id', ignoreDuplicates: true });
    } else {
      localStorage.setItem(GUEST_READS_KEY, JSON.stringify(next));
    }
  }, [updates, readIds, user]);

  return { updates, unread: countUnread(updates, readIds), markAllRead };
}
