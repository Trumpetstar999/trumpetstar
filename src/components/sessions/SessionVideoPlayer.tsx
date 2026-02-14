import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, Maximize2, Minimize2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface SessionVideoPlayerProps {
  vimeoVideoId: string;
  title?: string;
  onEnded: () => void;
  /** Start in fullscreen mode */
  startFullscreen?: boolean;
}

export function SessionVideoPlayer({ vimeoVideoId, title, onEnded, startFullscreen }: SessionVideoPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(startFullscreen || false);
  const [isLoading, setIsLoading] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const endedRef = useRef(false);

  const vimeoUrl = `https://player.vimeo.com/video/${vimeoVideoId}?autoplay=1&muted=0&playsinline=1&transparent=0&dnt=1&title=0&byline=0&portrait=0&controls=0`;

  const sendVimeoCommand = useCallback((method: string, value?: unknown) => {
    if (iframeRef.current?.contentWindow) {
      const message = value !== undefined
        ? JSON.stringify({ method, value })
        : JSON.stringify({ method });
      iframeRef.current.contentWindow.postMessage(message, '*');
    }
  }, []);

  const handleSpeedChange = useCallback((value: number[]) => {
    const speedPercent = value[0];
    setPlaybackSpeed(speedPercent);
    sendVimeoCommand('setPlaybackRate', speedPercent / 100);
  }, [sendVimeoCommand]);

  const handleSeek = useCallback((value: number[]) => {
    setCurrentTime(value[0]);
    sendVimeoCommand('seekTo', value[0]);
  }, [sendVimeoCommand]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      sendVimeoCommand('pause');
    } else {
      sendVimeoCommand('play');
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, sendVimeoCommand]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    endedRef.current = false;
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setPlayerReady(false);
    setIsPlaying(true);
  }, [vimeoVideoId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://player.vimeo.com') return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data.event === 'ready') {
          setPlayerReady(true);
          setIsLoading(false);
          sendVimeoCommand('setPlaybackRate', playbackSpeed / 100);
          sendVimeoCommand('getDuration');
          sendVimeoCommand('setVolume', 1);
        }

        if (data.method === 'getDuration' && data.value) {
          setDuration(data.value);
        }

        if (data.event === 'timeupdate' || data.method === 'getCurrentTime') {
          const sec = data.data?.seconds ?? data.value;
          if (sec !== undefined) setCurrentTime(sec);
        }

        if (data.event === 'playProgress' && data.data) {
          setCurrentTime(data.data.seconds || 0);
          if (data.data.duration) setDuration(data.data.duration);
        }

        if (data.event === 'play') setIsPlaying(true);
        if (data.event === 'pause') setIsPlaying(false);

        if ((data.event === 'ended' || data.event === 'finish') && !endedRef.current) {
          endedRef.current = true;
          setIsFullscreen(false);
          onEnded();
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('message', handleMessage);

    const enableVimeoApi = () => {
      if (iframeRef.current?.contentWindow) {
        ['ready', 'playProgress', 'timeupdate', 'play', 'pause', 'ended', 'finish'].forEach(evt => {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ method: 'addEventListener', value: evt }),
            '*'
          );
        });
      }
    };

    const pollInterval = setInterval(() => {
      if (playerReady && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: 'getCurrentTime' }), '*');
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: 'getDuration' }), '*');
      }
    }, 500);

    const iframe = iframeRef.current;
    if (iframe) iframe.addEventListener('load', enableVimeoApi);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (iframe) iframe.removeEventListener('load', enableVimeoApi);
      clearInterval(pollInterval);
    };
  }, [vimeoVideoId, onEnded, playerReady, sendVimeoCommand, playbackSpeed]);

  // Keyboard shortcuts in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
      if (e.key === ' ') { e.preventDefault(); togglePlayPause(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFullscreen, togglePlayPause]);

  // --- Inline (embedded) mode ---
  if (!isFullscreen) {
    return (
      <div className="w-full max-w-4xl">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
              <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={vimeoUrl}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            title={title || 'Video'}
          />
          {/* Fullscreen button overlay */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute bottom-3 right-3 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all backdrop-blur-sm"
            title="Vollbild"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
        {title && (
          <p className="text-center text-sm text-muted-foreground mt-2">{title}</p>
        )}
      </div>
    );
  }

  // --- Fullscreen mode ---
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col animate-fade-in overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(11, 46, 138, 0.98) 0%, rgba(0, 0, 0, 0.98) 100%)',
        height: '100dvh',
      }}
    >
      {/* Close fullscreen */}
      <button
        onClick={() => setIsFullscreen(false)}
        className="absolute top-4 right-4 z-[110] p-3 rounded-full glass hover:bg-white/20 text-white transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Video */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: 'linear-gradient(180deg, hsl(222 86% 29%) 0%, hsl(0 0% 0%) 100%)' }}>
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <span className="text-white/70">Video wird geladen...</span>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={vimeoUrl}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            title={title || 'Video'}
          />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 z-[105] glass px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all shrink-0 flex items-center justify-center"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Time */}
          <span className="text-white/80 text-sm font-mono w-12 text-right shrink-0">
            {formatTime(currentTime)}
          </span>

          {/* Timeline */}
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
            <span className="text-white font-bold text-sm w-12 text-center bg-white/10 rounded-full px-2 py-1">
              {playbackSpeed}%
            </span>
          </div>

          {/* Exit fullscreen */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="shrink-0 ml-2 pl-4 border-l border-white/20 p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all"
            title="Vollbild beenden"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
