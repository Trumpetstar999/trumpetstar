import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Star, AlertTriangle, WifiOff, RefreshCw, Play, Pause } from 'lucide-react';
import { Video } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { useVideoRecorder } from '@/hooks/useVideoRecorder';
import { useRecordings } from '@/hooks/useRecordings';
import { RecordingOverlay } from './RecordingOverlay';
import { toast } from 'sonner';

interface VideoPlayerProps {
  video: Video;
  levelId?: string;
  levelTitle?: string;
  onClose: () => void;
  onComplete: () => void;
}

type VimeoError = 'embed_blocked' | 'csp_blocked' | 'network_error' | 'unknown';

interface VimeoErrorLog {
  videoId: string;
  vimeoId: string;
  errorType: VimeoError;
  message: string;
  timestamp: string;
}

export function VideoPlayer({ video, levelId, levelTitle, onClose, onComplete }: VideoPlayerProps) {
  const { user } = useAuth();
  const recorder = useVideoRecorder();
  const { saveRecording } = useRecordings();
  const [showCompleted, setShowCompleted] = useState(false);
  const [error, setError] = useState<VimeoErrorLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(100);
  const hasCompletedRef = useRef(false);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save completion to database
  const saveCompletion = useCallback(async () => {
    if (!user) return false;
    
    try {
      // Insert new completion (allow multiple completions per video)
      const { error } = await supabase
        .from('video_completions')
        .insert({
          user_id: user.id,
          video_id: video.id,
          playback_speed: playbackSpeed,
        });
      
      if (error) {
        console.error('Error saving completion:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error saving completion:', err);
      return false;
    }
  }, [user, video.id, playbackSpeed]);

  const vimeoUrl = `https://player.vimeo.com/video/${video.vimeoId}?autoplay=1&muted=0&playsinline=1&transparent=0&dnt=1&title=0&byline=0&portrait=0&controls=1`;

  // Load saved playback speed
  useEffect(() => {
    if (user) {
      supabase
        .from('user_video_progress')
        .select('playback_speed')
        .eq('user_id', user.id)
        .eq('video_id', video.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.playback_speed) {
            const speedPercent = Math.round(data.playback_speed * 100);
            setPlaybackSpeed(speedPercent);
          }
        });
    }
  }, [user, video.id]);

  // Save progress to database
  const saveProgress = useCallback(async (seconds: number, dur: number) => {
    if (!user || dur <= 0) return;
    const progressPercent = (seconds / dur) * 100;
    
    await supabase
      .from('user_video_progress')
      .upsert({
        user_id: user.id,
        video_id: video.id,
        playback_speed: playbackSpeed / 100,
        progress_percent: progressPercent,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,video_id'
      });
  }, [user, video.id, playbackSpeed]);

  // Save playback speed when changed
  const savePlaybackSpeed = useCallback(async (speedPercent: number) => {
    if (!user) return;
    const playbackRate = speedPercent / 100;
    
    await supabase
      .from('user_video_progress')
      .upsert({
        user_id: user.id,
        video_id: video.id,
        playback_speed: playbackRate,
        progress_percent: duration > 0 ? (currentTime / duration) * 100 : 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,video_id'
      });
  }, [user, video.id, currentTime, duration]);

  // Send command to Vimeo player
  const sendVimeoCommand = useCallback((method: string, value?: unknown) => {
    if (iframeRef.current?.contentWindow) {
      const message = value !== undefined 
        ? JSON.stringify({ method, value })
        : JSON.stringify({ method });
      iframeRef.current.contentWindow.postMessage(message, '*');
    }
  }, []);

  // Handle playback speed change
  const handleSpeedChange = useCallback((value: number[]) => {
    const speedPercent = value[0];
    setPlaybackSpeed(speedPercent);
    const playbackRate = speedPercent / 100;
    sendVimeoCommand('setPlaybackRate', playbackRate);
    savePlaybackSpeed(speedPercent);
  }, [sendVimeoCommand, savePlaybackSpeed]);

  // Handle timeline seek
  const handleSeek = useCallback((value: number[]) => {
    const time = value[0];
    setCurrentTime(time);
    sendVimeoCommand('seekTo', time);
  }, [sendVimeoCommand]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      sendVimeoCommand('pause');
    } else {
      sendVimeoCommand('play');
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, sendVimeoCommand]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Log Vimeo errors to database for admin visibility
  const logVimeoError = useCallback(async (errorType: VimeoError, message: string) => {
    const errorLog: VimeoErrorLog = {
      videoId: video.id,
      vimeoId: video.vimeoId,
      errorType,
      message,
      timestamp: new Date().toISOString(),
    };
    
    setError(errorLog);
    console.error('[Vimeo Error]', errorLog);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase.from('activity_logs').insert([{
          user_id: authUser.id,
          action: 'vimeo_error',
          metadata: {
            videoId: errorLog.videoId,
            vimeoId: errorLog.vimeoId,
            errorType: errorLog.errorType,
            message: errorLog.message,
            timestamp: errorLog.timestamp,
          },
        }]);
      }
    } catch (e) {
      console.error('Failed to log Vimeo error:', e);
    }
  }, [video.id, video.vimeoId]);

  // Listen for Vimeo player events via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://player.vimeo.com') return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.event === 'ready') {
          setPlayerReady(true);
          setIsLoading(false);
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
          }
          sendVimeoCommand('setPlaybackRate', playbackSpeed / 100);
          sendVimeoCommand('getDuration');
          sendVimeoCommand('setVolume', 1);
        }

        if (data.method === 'getDuration' && data.value) {
          setDuration(data.value);
          durationRef.current = data.value;
        }
        
        if (data.event === 'timeupdate' || data.method === 'getCurrentTime') {
          if (data.data?.seconds !== undefined) {
            setCurrentTime(data.data.seconds);
            currentTimeRef.current = data.data.seconds;
          } else if (data.value !== undefined) {
            setCurrentTime(data.value);
            currentTimeRef.current = data.value;
          }
        }

        if (data.event === 'play') {
          setIsPlaying(true);
        }
        if (data.event === 'pause') {
          setIsPlaying(false);
          // Save progress when user pauses
          if (duration > 0) {
            saveProgress(currentTime, duration);
          }
        }
        
        if (data.event === 'playProgress' && data.data) {
          const percent = data.data.percent || 0;
          const seconds = data.data.seconds || 0;
          const dur = data.data.duration || duration;
          setCurrentTime(seconds);
          setDuration(dur);
          currentTimeRef.current = seconds;
          durationRef.current = dur;
          
          // Save progress periodically (every ~10 seconds based on playProgress events)
          if (dur > 0 && Math.floor(seconds) % 10 === 0 && seconds > 0) {
            saveProgress(seconds, dur);
          }
          
          if (percent >= 0.8 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            saveCompletion().then((isNew) => {
              if (isNew) {
                setShowCompleted(true);
                onComplete();
                setTimeout(() => setShowCompleted(false), 3000);
              }
            });
          }
        }
        
        if (data.method === 'timeupdate' && data.value) {
          const { seconds, duration: dur } = data.value;
          setCurrentTime(seconds);
          if (dur) setDuration(dur);
          if (dur > 0 && seconds / dur >= 0.8 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            saveCompletion().then((isNew) => {
              if (isNew) {
                setShowCompleted(true);
                onComplete();
                setTimeout(() => setShowCompleted(false), 3000);
              }
            });
          }
        }

        // Handle video end/finish event
        if (data.event === 'ended' || data.event === 'finish') {
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            saveCompletion().then((isNew) => {
              if (isNew) {
                setShowCompleted(true);
                onComplete();
                setTimeout(() => setShowCompleted(false), 3000);
              }
            });
          }
        }

        if (data.event === 'error') {
          const errorMsg = data.data?.message || 'Unknown Vimeo error';
          if (errorMsg.includes('privacy') || errorMsg.includes('embed') || errorMsg.includes('domain')) {
            logVimeoError('embed_blocked', errorMsg);
          } else {
            logVimeoError('unknown', errorMsg);
          }
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    
    const enableVimeoApi = () => {
      if (iframeRef.current?.contentWindow) {
        const methods = ['ready', 'playProgress', 'timeupdate', 'play', 'pause', 'error', 'ended', 'finish'];
        methods.forEach(method => {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ method: 'addEventListener', value: method }),
            '*'
          );
        });
      }
    };

    // Poll for current time every 500ms for more reliable progress tracking
    const pollInterval = setInterval(() => {
      if (playerReady && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: 'getCurrentTime' }), '*');
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: 'getDuration' }), '*');
      }
    }, 500);
    
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', enableVimeoApi);
    }

    loadTimeoutRef.current = setTimeout(() => {
      if (!playerReady) {
        setIsLoading(false);
        logVimeoError('network_error', 'Video konnte nicht geladen werden. Bitte überprüfe deine Internetverbindung.');
      }
    }, 15000);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (iframe) {
        iframe.removeEventListener('load', enableVimeoApi);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      clearInterval(pollInterval);
    };
  }, [onComplete, playerReady, logVimeoError, sendVimeoCommand, playbackSpeed, duration, saveCompletion, saveProgress, currentTime]);

  // Handle close with progress save
  const handleClose = useCallback(() => {
    // Save progress when closing the video player
    if (currentTimeRef.current > 0 && durationRef.current > 0) {
      saveProgress(currentTimeRef.current, durationRef.current);
    }
    onClose();
  }, [onClose, saveProgress]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, togglePlayPause]);

  const handleIframeError = () => {
    logVimeoError('csp_blocked', 'iFrame konnte nicht geladen werden. Mögliches CSP-Problem.');
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setPlayerReady(false);
    hasCompletedRef.current = false;
    
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  };

  // Recording handlers
  const handleStartRecording = useCallback(async () => {
    const success = await recorder.startRecording();
    if (success) {
      toast.info('Aufnahme gestartet');
    }
  }, [recorder]);

  const handleStopRecording = useCallback(async () => {
    const result = await recorder.stopRecording();
    if (result) {
      // Save with level reference
      await saveRecording({
        title: levelTitle ? `${levelTitle}` : video.title,
        blob: result.blob,
        duration: result.duration,
        levelId,
        levelTitle,
      });
    }
  }, [recorder, saveRecording, video.title, levelId, levelTitle]);

  // Cancel recording when closing the player
  const handleCloseWithRecording = useCallback(() => {
    if (recorder.isRecording) {
      recorder.cancelRecording();
    }
    handleClose();
  }, [recorder, handleClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col animate-fade-in"
      style={{ 
        background: 'linear-gradient(180deg, rgba(11, 46, 138, 0.98) 0%, rgba(0, 0, 0, 0.98) 100%)'
      }}
    >
      {/* Star earned animation - Enhanced celebration effect */}
      {showCompleted && (
        <div className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center">
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black/40 animate-fade-in" />
          
          {/* Star burst container */}
          <div className="relative animate-scale-in">
            {/* Glow rings */}
            <div className="absolute inset-0 -m-8 rounded-full bg-reward-gold/20 animate-ping" />
            <div className="absolute inset-0 -m-4 rounded-full bg-reward-gold/30 animate-pulse" />
            
            {/* Main content */}
            <div className="relative flex flex-col items-center gap-4 p-10 rounded-3xl bg-gradient-to-br from-amber-500/90 to-orange-600/90 shadow-2xl border-2 border-amber-300/50">
              {/* Sparkle effects */}
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-white rounded-full opacity-80 animate-ping" style={{ animationDelay: '0.1s' }} />
              <div className="absolute -top-2 -right-4 w-4 h-4 bg-yellow-200 rounded-full opacity-70 animate-ping" style={{ animationDelay: '0.3s' }} />
              <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-amber-200 rounded-full opacity-75 animate-ping" style={{ animationDelay: '0.2s' }} />
              <div className="absolute -bottom-3 -right-3 w-4 h-4 bg-white rounded-full opacity-80 animate-ping" style={{ animationDelay: '0.4s' }} />
              
              {/* Star icon with glow */}
              <div className="relative">
                <Star className="w-24 h-24 text-white fill-white drop-shadow-lg" 
                      style={{ filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))' }} />
              </div>
              
              {/* Text */}
              <div className="text-center">
                <span className="block text-3xl font-bold text-white drop-shadow-lg">+1 Stern!</span>
                <span className="block text-sm text-white/80 mt-1">Super gemacht! 🎉</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Close button - Glass style */}
      <button
        onClick={handleCloseWithRecording}
        className="absolute top-4 right-4 z-[110] p-3 rounded-full glass hover:bg-white/20 text-white transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Recording error overlay */}
      {recorder.error && (
        <RecordingOverlay
          isRecording={false}
          isStarting={false}
          isStopping={false}
          duration={0}
          error={recorder.error}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
          onClearError={recorder.clearError}
        />
      )}

      {/* Video container - true fullscreen optimized */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative w-full h-full aspect-video rounded-none overflow-hidden">
            {/* Loading indicator */}
            {isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center z-10"
                   style={{ background: 'linear-gradient(180deg, hsl(222 86% 29%) 0%, hsl(0 0% 0%) 100%)' }}>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-full border-4 border-reward-gold border-t-transparent animate-spin" />
                  <span className="text-white/70">Video wird geladen...</span>
                </div>
              </div>
            )}

            {/* Error display - Glass card */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center z-10"
                   style={{ background: 'linear-gradient(180deg, hsl(222 86% 29%) 0%, hsl(0 0% 0%) 100%)' }}>
                <div className="card-glass flex flex-col items-center gap-4 max-w-md text-center p-8 rounded-lg">
                  {error.errorType === 'network_error' ? (
                    <div className="w-16 h-16 rounded-full bg-accent-red/20 flex items-center justify-center">
                      <WifiOff className="w-8 h-8 text-accent-red" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-accent-red/20 flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-accent-red" />
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-gray-900">
                    {error.errorType === 'embed_blocked' 
                      ? 'Video nicht freigegeben'
                      : error.errorType === 'network_error'
                      ? 'Verbindungsproblem'
                      : 'Video-Fehler'}
                  </h3>
                  <p className="text-gray-600">
                    {error.errorType === 'embed_blocked' 
                      ? 'Dieses Video ist auf dieser Domain nicht freigegeben. Bitte kontaktiere den Administrator.'
                      : error.message}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <Button onClick={handleRetry} className="gap-2 bg-brand-blue-mid hover:bg-brand-blue-mid/90 text-white rounded-full">
                      <RefreshCw className="w-4 h-4" />
                      Erneut versuchen
                    </Button>
                    <Button variant="outline" onClick={handleClose} className="rounded-full">
                      Schließen
                    </Button>
                  </div>
                  <p className="text-gray-400 text-xs mt-4">
                    Video-ID: {video.vimeoId}
                  </p>
                </div>
              </div>
            )}

            {/* Vimeo iFrame Player */}
            <iframe
              ref={iframeRef}
              src={vimeoUrl}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              title={video.title}
              onError={handleIframeError}
            />
          </div>
        </div>
      </div>
      
      {/* Fixed bottom control bar - Glass style with gold accents */}
      <div className="shrink-0 z-[105] glass px-6 py-4 safe-bottom">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          {/* Play/Pause - Gold accent */}
          <button
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-reward-gold hover:bg-reward-gold/90 text-black transition-all shrink-0 flex items-center justify-center glow-gold"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          
          {/* Current time */}
          <span className="text-white/80 text-sm font-mono w-12 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          
          {/* Timeline slider - Gold */}
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            variant="gold"
            className="flex-1 min-w-[120px]"
          />
          
          {/* Duration */}
          <span className="text-white/80 text-sm font-mono w-12 shrink-0">
            {formatTime(duration)}
          </span>

          {/* Speed control */}
          <div className="flex items-center gap-3 shrink-0 ml-4 pl-4 border-l border-white/20">
            <span className="text-white/60 text-sm hidden md:inline">Tempo</span>
            <div className="flex items-center gap-2 w-28">
              <Slider
                value={[playbackSpeed]}
                min={40}
                max={120}
                step={1}
                onValueChange={handleSpeedChange}
                variant="player"
                className="flex-1"
              />
            </div>
            <span className="text-reward-gold font-bold text-sm w-12 text-center bg-white/10 rounded-full px-2 py-1">
              {playbackSpeed}%
            </span>
          </div>

          {/* Recording controls - separated with border */}
          <div className="shrink-0 ml-2 pl-4 border-l border-white/20">
            <RecordingOverlay
              isRecording={recorder.isRecording}
              isStarting={recorder.isStarting}
              isStopping={recorder.isStopping}
              duration={recorder.duration}
              error={null}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              onClearError={recorder.clearError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
