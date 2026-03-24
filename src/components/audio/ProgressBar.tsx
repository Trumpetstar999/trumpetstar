import { useRef, useCallback, useState, useEffect } from 'react';
import { formatTime } from '@/lib/formatTime';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  loopStart: number;
  loopEnd: number;
  loopEnabled: boolean;
  onLoopStartChange: (time: number) => void;
  onLoopEndChange: (time: number) => void;
}

export function ProgressBar({
  currentTime, duration, onSeek,
  loopStart, loopEnd, loopEnabled,
  onLoopStartChange, onLoopEndChange,
}: ProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'progress' | 'loopStart' | 'loopEnd' | null>(null);

  const getTimeFromPosition = useCallback((clientX: number) => {
    if (!progressRef.current || duration <= 0) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * duration;
  }, [duration]);

  const handleProgressClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    onSeek(getTimeFromPosition(clientX));
  }, [getTimeFromPosition, onSeek]);

  const handleMouseDown = useCallback((type: 'progress' | 'loopStart' | 'loopEnd') =>
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      setIsDragging(type);
    }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const time = getTimeFromPosition(clientX);
      if (isDragging === 'progress') onSeek(time);
      else if (isDragging === 'loopStart') onLoopStartChange(Math.min(time, loopEnd - 0.1));
      else if (isDragging === 'loopEnd') onLoopEndChange(Math.max(time, loopStart + 0.1));
    };
    const handleUp = () => setIsDragging(null);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, getTimeFromPosition, onSeek, onLoopStartChange, onLoopEndChange, loopStart, loopEnd]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const loopStartPercent = duration > 0 ? (loopStart / duration) * 100 : 0;
  const loopEndPercent = duration > 0 ? (loopEnd / duration) * 100 : 100;

  return (
    <div className="space-y-2">
      <div
        ref={progressRef}
        className="relative h-4 bg-progress-bg rounded-full cursor-pointer touch-manipulation select-none"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        onClick={handleProgressClick}
        onMouseDown={handleMouseDown('progress')}
        onTouchStart={handleMouseDown('progress')}
      >
        {loopEnabled && duration > 0 && (
          <div
            className="absolute top-0 h-full bg-gold/20 rounded-full"
            style={{ left: `${loopStartPercent}%`, width: `${loopEndPercent - loopStartPercent}%` }}
          />
        )}
        <div
          className="absolute top-0 left-0 h-full bg-progress-fill rounded-full transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg cursor-grab active:cursor-grabbing touch-manipulation"
          style={{ left: `calc(${progressPercent}% - 10px)`, WebkitTapHighlightColor: 'transparent' }}
        />
        {loopEnabled && duration > 0 && (
          <>
            <div
              className="loop-marker absolute top-1/2 -translate-y-1/2 z-10"
              style={{ left: `calc(${loopStartPercent}% - 10px)` }}
              onMouseDown={handleMouseDown('loopStart')}
              onTouchStart={handleMouseDown('loopStart')}
            />
            <div
              className="loop-marker absolute top-1/2 -translate-y-1/2 z-10"
              style={{ left: `calc(${loopEndPercent}% - 10px)` }}
              onMouseDown={handleMouseDown('loopEnd')}
              onTouchStart={handleMouseDown('loopEnd')}
            />
          </>
        )}
      </div>
      <div className="flex justify-between text-sm text-secondary-white">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
