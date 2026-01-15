import { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, Volume2, VolumeX, RotateCcw, Star } from 'lucide-react';
import { Video } from '@/types';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
  onComplete: () => void;
}

export function VideoPlayer({ video, onClose, onComplete }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [progress, setProgress] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const hasCompletedRef = useRef(false);

  // Simulate video progress for demo
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (0.5 * (speed / 100));
        
        // Check for 80% completion
        if (newProgress >= 80 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setShowCompleted(true);
          onComplete();
          setTimeout(() => setShowCompleted(false), 2000);
        }
        
        if (newProgress >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return newProgress;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying, speed, onComplete]);

  const formatTime = (percent: number) => {
    const totalSeconds = video.duration;
    const currentSeconds = Math.floor((percent / 100) * totalSeconds);
    const mins = Math.floor(currentSeconds / 60);
    const secs = currentSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotal = () => {
    const mins = Math.floor(video.duration / 60);
    const secs = video.duration % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fullscreen-overlay flex items-center justify-center animate-fade-in">
      {/* Star earned animation */}
      {showCompleted && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-scale-in">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-black/80 backdrop-blur-lg">
            <Star className="w-20 h-20 text-gold fill-gold animate-star-shine" />
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
      
      {/* Video container (placeholder for Vimeo embed) */}
      <div className="relative w-full max-w-5xl aspect-video mx-8 rounded-2xl overflow-hidden bg-black">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        
        {/* Play/Pause overlay */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute inset-0 flex items-center justify-center group"
        >
          <div className={cn(
            'w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all',
            isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          )}>
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white fill-white" />
            ) : (
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            )}
          </div>
        </button>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div 
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-5xl mx-auto">
          {/* Video title */}
          <h2 className="text-xl font-semibold text-white mb-4">{video.title}</h2>
          
          <div className="flex items-center justify-between gap-8">
            {/* Playback controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>
              
              <button
                onClick={() => {
                  setProgress(0);
                  hasCompletedRef.current = false;
                }}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              
              <span className="text-white/80 text-sm font-medium">
                {formatTime(progress)} / {formatTotal()}
              </span>
            </div>
            
            {/* Speed control - ALWAYS VISIBLE */}
            <div className="flex items-center gap-4 px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <span className="text-white/80 text-sm font-medium whitespace-nowrap">
                Tempo
              </span>
              <Slider
                variant="player"
                value={[speed]}
                onValueChange={(values) => setSpeed(values[0])}
                min={40}
                max={120}
                step={5}
                className="w-48"
              />
              <span className="text-white font-bold text-lg w-14 text-right">
                {speed}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
