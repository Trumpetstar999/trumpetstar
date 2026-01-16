import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Star, AlertTriangle, WifiOff, RefreshCw, Play, Pause } from 'lucide-react';
import { Video } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';

interface VideoPlayerProps {
  video: Video;
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

export function VideoPlayer({ video, onClose, onComplete }: VideoPlayerProps) {
  const { user } = useAuth();
  const [showCompleted, setShowCompleted] = useState(false);
  const [error, setError] = useState<VimeoErrorLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(100); // 100 = 1.0x
  const hasCompletedRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Build Vimeo player URL - enable sound, autoplay works on mute but user can unmute
  const vimeoUrl = `https://player.vimeo.com/video/${video.vimeoId}?autoplay=1&playsinline=1&transparent=0&dnt=1&title=0&byline=0&portrait=0&controls=1`;

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
      // Check if message is from Vimeo
      if (event.origin !== 'https://player.vimeo.com') return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Player is ready
        if (data.event === 'ready') {
          setPlayerReady(true);
          setIsLoading(false);
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
          }
          // Apply saved playback speed
          sendVimeoCommand('setPlaybackRate', playbackSpeed / 100);
          // Get duration
          sendVimeoCommand('getDuration');
        }

        // Duration received
        if (data.method === 'getDuration' && data.value) {
          setDuration(data.value);
        }
        
        // Time update
        if (data.event === 'timeupdate' || data.method === 'getCurrentTime') {
          if (data.data?.seconds !== undefined) {
            setCurrentTime(data.data.seconds);
          } else if (data.value !== undefined) {
            setCurrentTime(data.value);
          }
        }

        // Play state changes
        if (data.event === 'play') {
          setIsPlaying(true);
        }
        if (data.event === 'pause') {
          setIsPlaying(false);
        }
        
        // Check for progress event (80% completion)
        if (data.event === 'playProgress' && data.data) {
          const percent = data.data.percent || 0;
          setCurrentTime(data.data.seconds || 0);
          setDuration(data.data.duration || duration);
          
          if (percent >= 0.8 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            setShowCompleted(true);
            onComplete();
            setTimeout(() => setShowCompleted(false), 2000);
          }
        }
        
        // Alternative: timeupdate event for completion
        if (data.method === 'timeupdate' && data.value) {
          const { seconds, duration: dur } = data.value;
          setCurrentTime(seconds);
          if (dur) setDuration(dur);
          if (dur > 0 && seconds / dur >= 0.8 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            setShowCompleted(true);
            onComplete();
            setTimeout(() => setShowCompleted(false), 2000);
          }
        }

        // Handle Vimeo error events
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
    
    // Enable Vimeo API events after iframe loads
    const enableVimeoApi = () => {
      if (iframeRef.current?.contentWindow) {
        // Subscribe to player events
        const methods = ['ready', 'playProgress', 'timeupdate', 'play', 'pause', 'error'];
        methods.forEach(method => {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ method: 'addEventListener', value: method }),
            '*'
          );
        });
      }
    };
    
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', enableVimeoApi);
    }

    // Set timeout for loading - if iframe doesn't respond in 15s, show error
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
    };
  }, [onComplete, playerReady, logVimeoError, sendVimeoCommand, playbackSpeed, duration]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, togglePlayPause]);

  // Handle iframe load error
  const handleIframeError = () => {
    logVimeoError('csp_blocked', 'iFrame konnte nicht geladen werden. Mögliches CSP-Problem.');
  };

  // Retry loading
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setPlayerReady(false);
    hasCompletedRef.current = false;
    
    // Force iframe reload
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

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
      {/* Star earned animation */}
      {showCompleted && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] animate-scale-in">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-black/80 backdrop-blur-lg">
            <Star className="w-20 h-20 text-gold fill-gold animate-pulse" />
            <span className="text-2xl font-bold text-white">+1 Stern!</span>
          </div>
        </div>
      )}
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[110] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      
      {/* Video container - fills available space, respects control bar */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        <div className="relative w-full h-full max-w-6xl flex items-center justify-center">
          <div className="relative w-full aspect-video max-h-full rounded-lg overflow-hidden bg-black">
            {/* Loading indicator */}
            {isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-white/60">Video wird geladen...</span>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
                  {error.errorType === 'network_error' ? (
                    <WifiOff className="w-16 h-16 text-destructive" />
                  ) : (
                    <AlertTriangle className="w-16 h-16 text-destructive" />
                  )}
                  <h3 className="text-xl font-semibold text-white">
                    {error.errorType === 'embed_blocked' 
                      ? 'Video nicht freigegeben'
                      : error.errorType === 'network_error'
                      ? 'Verbindungsproblem'
                      : 'Video-Fehler'}
                  </h3>
                  <p className="text-white/60">
                    {error.errorType === 'embed_blocked' 
                      ? 'Dieses Video ist auf dieser Domain nicht freigegeben. Bitte kontaktiere den Administrator.'
                      : error.message}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={handleRetry} className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Erneut versuchen
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                      Schließen
                    </Button>
                  </div>
                  <p className="text-white/40 text-xs mt-4">
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
      
      {/* Fixed bottom control bar - always visible */}
      <div className="shrink-0 z-[105] bg-gradient-to-t from-black via-black/95 to-black/80 px-4 py-3 safe-bottom">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          {/* Video title - compact on landscape */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white truncate">{video.title}</h2>
            <span className="text-white/40 text-xs hidden sm:block">ESC • Leertaste</span>
          </div>

          {/* Timeline + Speed in one row on landscape */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Play/Pause + Timeline */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <button
                onClick={togglePlayPause}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              
              <span className="text-white/70 text-xs font-mono w-10 text-right shrink-0">
                {formatTime(currentTime)}
              </span>
              
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                variant="player"
                className="flex-1 min-w-[100px]"
              />
              
              <span className="text-white/70 text-xs font-mono w-10 shrink-0">
                {formatTime(duration)}
              </span>
            </div>

            {/* Speed control - inline on larger screens */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white/60 text-xs">Tempo:</span>
              <div className="flex items-center gap-2 w-32">
                <Slider
                  value={[playbackSpeed]}
                  min={40}
                  max={120}
                  step={5}
                  onValueChange={handleSpeedChange}
                  variant="player"
                  className="flex-1"
                />
              </div>
              <span className="text-white font-medium text-xs w-10 text-center bg-white/10 rounded px-1.5 py-0.5">
                {playbackSpeed}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
