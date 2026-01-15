import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Pause, Play, Volume2, VolumeX, RotateCcw, Star, Maximize, Minimize } from 'lucide-react';
import { Video } from '@/types';
import { cn } from '@/lib/utils';

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
  const [isDragging, setIsDragging] = useState(false);
  const hasCompletedRef = useRef(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Speed control with drag
  const handleSpeedChange = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newSpeed = Math.round(40 + percentage * 80); // 40-120% in 1% steps
    setSpeed(newSpeed);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSpeedChange(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleSpeedChange(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleSpeedChange(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleSpeedChange(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleSpeedChange]);

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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'Escape':
          onClose();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSpeed(prev => Math.min(120, prev + 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSpeed(prev => Math.max(40, prev - 1));
          break;
        case 'm':
          setIsMuted(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const speedPercentage = ((speed - 40) / 80) * 100;

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
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-full max-w-6xl aspect-video mx-4 rounded-2xl overflow-hidden bg-black/50">
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
              'w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all',
              isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            )}>
              {isPlaying ? (
                <Pause className="w-12 h-12 text-white fill-white" />
              ) : (
                <Play className="w-12 h-12 text-white fill-white ml-1" />
              )}
            </div>
          </button>
          
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
            <div 
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="max-w-6xl mx-auto">
          {/* Video title */}
          <h2 className="text-xl font-semibold text-white mb-4">{video.title}</h2>
          
          <div className="flex items-center justify-between gap-8">
            {/* Playback controls */}
            <div className="flex items-center gap-3">
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
              
              <span className="text-white/80 text-sm font-medium ml-2">
                {formatTime(progress)} / {formatTotal()}
              </span>
            </div>
            
            {/* Speed control - Custom draggable slider */}
            <div className="flex items-center gap-4 px-5 py-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <span className="text-white/80 text-sm font-medium whitespace-nowrap">
                Tempo
              </span>
              
              {/* Speed labels */}
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs">40%</span>
                
                {/* Custom Slider */}
                <div
                  ref={sliderRef}
                  className="relative w-48 h-10 cursor-pointer select-none"
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                >
                  {/* Track background */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full bg-white/30" />
                  
                  {/* Track fill */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 left-0 h-2 rounded-full bg-white transition-all"
                    style={{ width: `${speedPercentage}%` }}
                  />
                  
                  {/* Speed markers */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-0.5">
                    {[40, 60, 80, 100, 120].map((mark) => (
                      <div
                        key={mark}
                        className={cn(
                          'w-1 h-1 rounded-full transition-colors',
                          speed >= mark ? 'bg-white' : 'bg-white/30'
                        )}
                      />
                    ))}
                  </div>
                  
                  {/* Thumb */}
                  <div
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-lg transition-transform',
                      isDragging && 'scale-110'
                    )}
                    style={{ left: `${speedPercentage}%` }}
                  />
                </div>
                
                <span className="text-white/50 text-xs">120%</span>
              </div>
              
              {/* Current speed display */}
              <div className="min-w-[60px] text-right">
                <span className={cn(
                  'font-bold text-xl transition-colors',
                  speed < 60 ? 'text-blue-400' : 
                  speed > 100 ? 'text-orange-400' : 
                  'text-white'
                )}>
                  {speed}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Keyboard hints */}
          <div className="flex items-center gap-4 mt-4 text-white/40 text-xs">
            <span>Leertaste: Play/Pause</span>
            <span>↑↓: Tempo</span>
            <span>M: Stumm</span>
            <span>ESC: Schließen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
