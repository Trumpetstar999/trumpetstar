import { useNavigate } from 'react-router-dom';
import { usePracticeSessions } from '@/hooks/usePracticeSessions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Play, Edit, Copy, Trash2, Share2, Clock, Music, Video, FileText, Timer } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ShareSessionDialog } from '@/components/sessions/ShareSessionDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SessionWithDetails } from '@/types/sessions';
import { Header } from '@/components/layout/Header';
import { TabBar } from '@/components/layout/TabBar';
import { TabId } from '@/types';

function SessionCard({ session, index, thumbnails, onPlay, onEdit, onDuplicate, onShare, onDelete }: {
  session: SessionWithDetails;
  index: number;
  thumbnails: Record<string, string>;
  onPlay: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return m < 60 ? `~${m} Min.` : `~${Math.floor(m / 60)}h ${m % 60}m`;
  };

  // Collect up to 4 thumbnails from video items
  const videoThumbs = useMemo(() => {
    const thumbs: string[] = [];
    for (const sec of session.sections) {
      for (const item of sec.items) {
        if (item.item_type === 'vimeo_video' && item.ref_id && thumbnails[item.ref_id] && !thumbs.includes(thumbnails[item.ref_id])) {
          thumbs.push(thumbnails[item.ref_id]);
          if (thumbs.length >= 4) return thumbs;
        }
      }
    }
    return thumbs;
  }, [session, thumbnails]);

  const videoCount = session.sections.reduce((a, s) => a + s.items.filter(i => i.item_type === 'vimeo_video').length, 0);
  const pdfCount = session.sections.reduce((a, s) => a + s.items.filter(i => i.item_type === 'pdf').length, 0);
  const pauseCount = session.sections.reduce((a, s) => a + s.items.filter(i => i.item_type === 'pause').length, 0);

  return (
    <div className="group relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div className="flex">
        {/* Thumbnail strip */}
        <div className="relative w-32 sm:w-44 shrink-0 bg-muted/30">
          {videoThumbs.length > 0 ? (
            <div className="grid grid-cols-2 grid-rows-2 h-full">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="relative overflow-hidden">
                  {videoThumbs[i] ? (
                    <img src={videoThumbs[i]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted/20" />
                  )}
                </div>
              ))}
              {/* Play overlay */}
              <button
                onClick={onPlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                </div>
              </button>
            </div>
          ) : (
            <div className="h-full min-h-[100px] flex items-center justify-center">
              <Music className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground text-base truncate">
                {session.name}
              </h3>
              <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5 shrink-0">
                #{index + 1}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(session.estimatedDuration)}
              </span>
              {videoCount > 0 && (
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3" /> {videoCount}
                </span>
              )}
              {pdfCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {pdfCount}
                </span>
              )}
              {pauseCount > 0 && (
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" /> {pauseCount}
                </span>
              )}
            </div>

            {/* Section pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {session.sections.filter(s => s.items.length > 0).map(sec => (
                <span key={sec.id} className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5">
                  {sec.title} ({sec.items.length})
                </span>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
            <span className="text-[11px] text-muted-foreground/60">
              {session.last_used_at
                ? `Zuletzt: ${new Date(session.last_used_at).toLocaleDateString('de')}`
                : 'Noch nicht gespielt'}
            </span>
            <div className="flex gap-0.5">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onPlay} title="Abspielen">
                <Play className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onEdit} title="Bearbeiten">
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onDuplicate} title="Duplizieren">
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onShare} title="Teilen">
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete} title="Löschen">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionListPage() {
  const navigate = useNavigate();
  const { sessions, isLoading, deleteSession, duplicateSession } = usePracticeSessions();
  const [shareSessionId, setShareSessionId] = useState<string | null>(null);

  // Collect all video ref_ids to fetch thumbnails
  const videoRefIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of sessions) {
      for (const sec of s.sections) {
        for (const item of sec.items) {
          if (item.item_type === 'vimeo_video' && item.ref_id) ids.add(item.ref_id);
        }
      }
    }
    return Array.from(ids);
  }, [sessions]);

  const { data: thumbnails = {} } = useQuery({
    queryKey: ['session-thumbnails', videoRefIds],
    queryFn: async () => {
      if (videoRefIds.length === 0) return {};
      const { data } = await (supabase as any)
        .from('videos')
        .select('id, thumbnail_url')
        .in('id', videoRefIds);
      const map: Record<string, string> = {};
      if (data) {
        for (const v of data) {
          if (v.thumbnail_url) map[v.id] = v.thumbnail_url;
        }
      }
      return map;
    },
    enabled: videoRefIds.length > 0,
  });

  const handleTabChange = (tab: TabId) => {
    navigate('/', { state: { activeTab: tab } });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Übesessions" stars={0} />
      <main className="flex-1 overflow-auto pb-24">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/', { state: { activeTab: 'practice' } })} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">Meine Übesessions</h1>
              {sessions.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
                </p>
              )}
            </div>
            <Button onClick={() => navigate('/practice/sessions/new')} className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" /> Neue Session
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {!isLoading && sessions.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-primary/50" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Noch keine Sessions</h3>
              <p className="text-muted-foreground mb-6 text-sm">Erstelle deine erste Übesession und starte strukturiert!</p>
              <Button onClick={() => navigate('/practice/sessions/new')} className="gap-2 rounded-xl">
                <Plus className="w-4 h-4" /> Neue Übesession
              </Button>
            </div>
          )}

          <div className="grid gap-4">
            {sessions.map((session, i) => (
              <SessionCard
                key={session.id}
                session={session}
                index={i}
                thumbnails={thumbnails}
                onPlay={() => navigate(`/practice/sessions/${session.id}/play`)}
                onEdit={() => navigate(`/practice/sessions/${session.id}/edit`)}
                onDuplicate={() => duplicateSession.mutate(session.id)}
                onShare={() => setShareSessionId(session.id)}
                onDelete={() => { if (confirm('Session löschen?')) deleteSession.mutate(session.id); }}
              />
            ))}
          </div>

          {shareSessionId && (
            <ShareSessionDialog
              sessionId={shareSessionId}
              onClose={() => setShareSessionId(null)}
            />
          )}
        </div>
      </main>
      <TabBar activeTab="practice" onTabChange={handleTabChange} hidden={false} />
    </div>
  );
}
