import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Star, AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';
import { Video } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

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
  const [showCompleted, setShowCompleted] = useState(false);
  const [error, setError] = useState<VimeoErrorLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const hasCompletedRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Build Vimeo player URL - ONLY use official iframe embed
  const vimeoUrl = `https://player.vimeo.com/video/${video.vimeoId}?autoplay=1&playsinline=1&muted=0&transparent=0&dnt=1&title=0&byline=0&portrait=0`;

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert([{
          user_id: user.id,
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
        }
        
        // Check for progress event (80% completion)
        if (data.event === 'playProgress' && data.data) {
          const percent = data.data.percent || 0;
          if (percent >= 0.8 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            setShowCompleted(true);
            onComplete();
            setTimeout(() => setShowCompleted(false), 2000);
          }
        }
        
        // Alternative: timeupdate event
        if (data.method === 'timeupdate' && data.value) {
          const { seconds, duration } = data.value;
          if (duration > 0 && seconds / duration >= 0.8 && !hasCompletedRef.current) {
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
        const methods = ['ready', 'playProgress', 'timeupdate', 'error'];
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
  }, [onComplete, playerReady, logVimeoError]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-fade-in">
      {/* Star earned animation */}
      {showCompleted && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-scale-in">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-black/80 backdrop-blur-lg">
            <Star className="w-20 h-20 text-gold fill-gold animate-pulse" />
            <span className="text-2xl font-bold text-white">+1 Stern!</span>
          </div>
        </div>
      )}
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      
      {/* Video container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl aspect-video rounded-2xl overflow-hidden bg-black">
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

          {/* Vimeo iFrame Player - OFFICIAL EMBED ONLY */}
          <iframe
            ref={iframeRef}
            src={vimeoUrl}
            className="w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            title={video.title}
            onError={handleIframeError}
            style={{ 
              // Ensure iframe is visible on iPad
              WebkitOverflowScrolling: 'touch',
            }}
          />
        </div>
      </div>
      
      {/* Video title */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-white">{video.title}</h2>
          <p className="text-white/60 text-sm mt-1">ESC zum Schließen</p>
        </div>
      </div>
    </div>
  );
}
