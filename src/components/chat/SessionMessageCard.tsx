import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Copy, Music, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

export interface SessionMessageData {
  type: 'practice_session';
  sessionId: string;
  name: string;
  itemCount: number;
  estimatedDuration: number;
}

interface SessionMessageCardProps {
  data: SessionMessageData;
  isOwnMessage: boolean;
}

export function SessionMessageCard({ data, isOwnMessage }: SessionMessageCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `~${mins} Min.`;
    const hrs = Math.floor(mins / 60);
    const rest = mins % 60;
    return `~${hrs}h ${rest}m`;
  };

  const handlePlay = () => {
    navigate(`/practice/sessions/${data.sessionId}/play`);
  };

  const handleClone = async () => {
    if (!user || cloning) return;
    setCloning(true);
    try {
      const { data: sessions } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('id', data.sessionId)
        .limit(1);

      if (!sessions || sessions.length === 0) throw new Error(t('sessionCard.notFound'));
      const session = sessions[0];

      const { data: sections } = await supabase
        .from('practice_session_sections')
        .select('*')
        .eq('session_id', session.id)
        .order('order_index');

      const { data: items } = await supabase
        .from('practice_session_items')
        .select('*')
        .eq('session_id', session.id)
        .order('order_index');

      const { data: newSession, error: sessionErr } = await supabase
        .from('practice_sessions')
        .insert({
          owner_user_id: user.id,
          name: session.name,
          break_enabled: session.break_enabled,
          break_seconds_default: session.break_seconds_default,
        })
        .select()
        .single();

      if (sessionErr) throw sessionErr;

      for (const sec of (sections || [])) {
        const { data: newSec, error: secErr } = await supabase
          .from('practice_session_sections')
          .insert({
            session_id: newSession.id,
            title: sec.title,
            section_key: sec.section_key,
            order_index: sec.order_index,
          })
          .select()
          .single();

        if (secErr) throw secErr;

        const sectionItems = (items || []).filter(i => i.section_id === sec.id);
        if (sectionItems.length > 0) {
          await supabase.from('practice_session_items').insert(
            sectionItems.map(it => ({
              session_id: newSession.id,
              section_id: newSec.id,
              order_index: it.order_index,
              item_type: it.item_type,
              ref_id: it.ref_id,
              title_cache: it.title_cache,
              duration_mode: it.duration_mode,
              duration_seconds: it.duration_seconds,
            }))
          );
        }
      }

      setCloned(true);
      toast.success(t('sessionCard.copySuccess'));
    } catch (err) {
      console.error('Clone error:', err);
      toast.error(t('sessionCard.copyError'));
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="w-[260px] rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Music className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[13px] truncate">{data.name}</p>
          <p className="text-white/70 text-[11px]">
            {data.itemCount} Videos · {formatDuration(data.estimatedDuration)}
          </p>
        </div>
      </div>

      <div className="bg-white p-2 flex gap-2">
        <Button
          size="sm"
          onClick={handlePlay}
          className="flex-1 bg-[#25D366] hover:bg-[#1DAF5A] text-white text-xs h-8"
        >
          <Play className="w-3.5 h-3.5 mr-1" fill="currentColor" />
          {t('sessionCard.start')}
        </Button>
        {!isOwnMessage && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleClone}
            disabled={cloning || cloned}
            className="flex-1 text-xs h-8"
          >
            {cloning ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : cloned ? (
              <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1" />
            )}
            {cloned ? t('sessionCard.copied') : t('sessionCard.copy')}
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper to check if content is a session message
export function isSessionContent(content: string): SessionMessageData | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === 'practice_session' && parsed.sessionId) {
      return parsed as SessionMessageData;
    }
  } catch {
    // Not JSON
  }
  return null;
}
