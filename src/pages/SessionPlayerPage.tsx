import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePracticeSessions } from '@/hooks/usePracticeSessions';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useSessionPlayer } from '@/hooks/useSessionPlayer';
import { Button } from '@/components/ui/button';
import { SessionWithDetails } from '@/types/sessions';
import { ArrowLeft, SkipBack, RotateCcw, SkipForward, FastForward, X, List, Video, FileText, Timer, Plus } from 'lucide-react';
import { SessionVideoPlayer } from '@/components/sessions/SessionVideoPlayer';
import { cn } from '@/lib/utils';

export default function SessionPlayerPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchSessionById, markUsed } = usePracticeSessions();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [autoPauseRemaining, setAutoPauseRemaining] = useState(0);
  const [pauseRemaining, setPauseRemaining] = useState(0);
  const [pdfTimerRemaining, setPdfTimerRemaining] = useState(0);
  const [pdfTimerRunning, setPdfTimerRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = useSessionPlayer(session);

  useEffect(() => {
    if (id) {
      fetchSessionById(id).then(s => {
        setSession(s);
        if (s) {
          markUsed(s.id);
          // Award a star for starting a practice session
          if (user) {
            supabase.from('video_completions').insert([{
              user_id: user.id,
              video_id: null,
              playback_speed: 100,
            }]).then(({ error }) => {
              if (!error) console.log('[Session] Star awarded for starting session');
            });
          }
        }
      });
    }
  }, [id, fetchSessionById, markUsed, user]);

  const currentItem = player.currentQueueItem?.item;
  const currentSection = player.currentQueueItem?.sectionTitle;

  // Auto-pause countdown
  useEffect(() => {
    if (player.phase === 'auto-pause' && session) {
      setAutoPauseRemaining(session.break_seconds_default);
      const iv = setInterval(() => {
        setAutoPauseRemaining(prev => {
          if (prev <= 1) { clearInterval(iv); player.skipPause(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [player.phase, session]);

  // Pause item countdown
  useEffect(() => {
    if (currentItem?.item_type === 'pause' && player.phase === 'playing') {
      setPauseRemaining(currentItem.duration_seconds || 60);
      const iv = setInterval(() => {
        setPauseRemaining(prev => {
          if (prev <= 1) { clearInterval(iv); player.goNext(); return 0; }
          return prev - 1;
        });
      }, 1000);
      intervalRef.current = iv;
      return () => clearInterval(iv);
    }
  }, [currentItem, player.phase, player.currentIndex]);

  // PDF timer
  useEffect(() => {
    if (currentItem?.item_type === 'pdf' && player.phase === 'playing') {
      setPdfTimerRemaining(currentItem.duration_seconds || 120);
      setPdfTimerRunning(false);
    }
  }, [currentItem, player.currentIndex]);

  useEffect(() => {
    if (pdfTimerRunning && pdfTimerRemaining > 0) {
      const iv = setInterval(() => {
        setPdfTimerRemaining(prev => {
          if (prev <= 1) { clearInterval(iv); player.goNext(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [pdfTimerRunning, pdfTimerRemaining]);

  const addPauseTime = (seconds: number) => {
    if (player.phase === 'auto-pause') setAutoPauseRemaining(p => p + seconds);
    else if (currentItem?.item_type === 'pause') setPauseRemaining(p => p + seconds);
  };

  const handleVideoEnd = useCallback(() => {
    player.goNext();
  }, [player]);

  if (!session) return <div className="flex items-center justify-center h-full text-muted-foreground">{t('common.loading')}</div>;
  if (player.phase === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <h2 className="text-2xl font-bold">🎺 {t('practice.sessions.sessionFinished')}</h2>
        <p className="text-muted-foreground">{t('practice.sessions.allItemsDone')}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => player.restart()}>{t('practice.sessions.again')}</Button>
          <Button onClick={() => navigate('/practice/sessions')}>{t('common.back')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Bar */}
      <div className="flex items-center gap-3 p-3 border-b border-border/50 bg-card/50">
        <Button variant="ghost" size="icon" onClick={() => { if (confirm(t('sharedSession.endSession'))) navigate('/practice/sessions'); }}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold truncate flex-1">{session.name}</h1>
        <span className="text-sm text-muted-foreground">Item {player.currentIndex + 1}/{player.totalItems}</span>
        <span className="text-sm text-muted-foreground">• {currentSection}</span>
        <Button variant="ghost" size="sm" onClick={() => setShowOverview(!showOverview)} className="gap-1">
          <List className="w-4 h-4" /> {t('practice.sessions.overview')}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          {player.phase === 'auto-pause' && (
            <div className="text-center space-y-6">
              <p className="text-lg text-muted-foreground">Auto-Pause</p>
              <p className="text-6xl font-bold tabular-nums">{autoPauseRemaining}s</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => addPauseTime(30)}>
                  <Plus className="w-4 h-4 mr-1" /> 30s
                </Button>
                <Button onClick={() => player.skipPause()}>{t('practice.sessions.skipPause')}</Button>
              </div>
            </div>
          )}

          {player.phase === 'playing' && currentItem?.item_type === 'vimeo_video' && (
            <SessionVideoPlayer
              key={`video-${player.currentIndex}`}
              vimeoVideoId={(currentItem as any).vimeo_video_id || currentItem.ref_id || ''}
              title={currentItem.title_cache || undefined}
              onEnded={handleVideoEnd}
            />
          )}

          {player.phase === 'playing' && currentItem?.item_type === 'pdf' && (
            <div className="text-center space-y-6">
              <FileText className="w-16 h-16 text-gold mx-auto" />
              <h2 className="text-xl font-bold">{currentItem.title_cache}</h2>
              <p className="text-5xl font-bold tabular-nums">
                {Math.floor(pdfTimerRemaining / 60)}:{(pdfTimerRemaining % 60).toString().padStart(2, '0')}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setPdfTimerRunning(!pdfTimerRunning)}>
                  {pdfTimerRunning ? t('practice.sessions.pauseTimer') : t('practice.sessions.startTimer')}
                </Button>
                <Button variant="outline" onClick={() => { setPdfTimerRemaining(currentItem.duration_seconds || 120); setPdfTimerRunning(false); }}>
                  {t('practice.sessions.resetTimer')}
                </Button>
                <Button onClick={() => player.goNext()}>{t('common.next')}</Button>
              </div>
            </div>
          )}

          {player.phase === 'playing' && currentItem?.item_type === 'pause' && (
            <div className="text-center space-y-6">
              <Timer className="w-16 h-16 text-accent mx-auto" />
              <p className="text-lg text-muted-foreground">{t('practice.sessions.restUp')}</p>
              <p className="text-6xl font-bold tabular-nums">{pauseRemaining}s</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => addPauseTime(30)}>
                  <Plus className="w-4 h-4 mr-1" /> 30s
                </Button>
                <Button onClick={() => player.goNext()}>{t('practice.sessions.skipPause')}</Button>
              </div>
            </div>
          )}
        </div>

        {/* Overview Panel */}
        {showOverview && (
          <div className="w-72 border-l border-border/50 overflow-y-auto bg-card/30 p-3">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">{t('practice.sessions.overview')}</h3>
            {session.sections.map((sec, si) => (
              <div key={sec.id} className="mb-3">
                <p className="text-xs font-bold text-muted-foreground mb-1">{sec.title}</p>
                {sec.items.map((item, ii) => {
                  const globalIdx = player.queue.findIndex(q => q.item.id === item.id);
                  const isCurrent = globalIdx === player.currentIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => player.jumpTo(globalIdx)}
                      className={cn(
                        'w-full text-left text-xs p-1.5 rounded flex items-center gap-1.5 transition-colors',
                        isCurrent ? 'bg-primary/20 text-primary' : 'hover:bg-accent/30'
                      )}
                    >
                      {item.item_type === 'vimeo_video' && <Video className="w-3 h-3 shrink-0" />}
                      {item.item_type === 'pdf' && <FileText className="w-3 h-3 shrink-0" />}
                      {item.item_type === 'pause' && <Timer className="w-3 h-3 shrink-0" />}
                      <span className="truncate">{item.title_cache || item.item_type}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-4 p-3 border-t border-border/50 bg-card/50">
        <Button variant="outline" size="sm" onClick={() => player.goPrev()} disabled={player.currentIndex === 0}>
          <SkipBack className="w-4 h-4 mr-1" /> {t('common.back')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => player.replay()}>
          <RotateCcw className="w-4 h-4 mr-1" /> {t('practice.sessions.replay')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => player.goNext()}>
          {t('common.next')} <SkipForward className="w-4 h-4 ml-1" />
        </Button>
        <Button variant="destructive" size="sm" onClick={() => { if (confirm(t('sharedSession.endSession'))) navigate('/practice/sessions'); }}>
          <X className="w-4 h-4 mr-1" /> {t('practice.sessions.endSession')}
        </Button>
      </div>
    </div>
  );
}
