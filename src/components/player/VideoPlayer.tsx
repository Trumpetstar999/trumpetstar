import { useState, useEffect, useRef } from 'react';
import { X, Star } from 'lucide-react';
import { Video } from '@/types';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
  onComplete: () => void;
}

export function VideoPlayer({ video, onClose, onComplete }: VideoPlayerProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const hasCompletedRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build Vimeo player URL
  const vimeoUrl = video.vimeoPlayerUrl 
    ? `${video.vimeoPlayerUrl}?autoplay=1&title=0&byline=0&portrait=0`
    : `https://player.vimeo.com/video/${video.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`;

  // Listen for Vimeo player events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if message is from Vimeo
      if (event.origin !== 'https://player.vimeo.com') return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
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
      } catch (e) {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Enable Vimeo API events after iframe loads
    const enableVimeoApi = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ method: 'addEventListener', value: 'playProgress' }),
          '*'
        );
      }
    };
    
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', enableVimeoApi);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      if (iframe) {
        iframe.removeEventListener('load', enableVimeoApi);
      }
    };
  }, [onComplete]);

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
          <iframe
            ref={iframeRef}
            src={vimeoUrl}
            className="w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={video.title}
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
