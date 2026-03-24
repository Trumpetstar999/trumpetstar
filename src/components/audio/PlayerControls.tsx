import { Play, Pause, Square, SkipBack, SkipForward } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function PlayerControls({
  isPlaying, onTogglePlay, onStop, onPrev, onNext, hasPrev, hasNext,
}: PlayerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        className="player-control disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous track"
      >
        <SkipBack className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={onStop}
        className="player-control"
        aria-label="Stop"
      >
        <Square className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={onTogglePlay}
        className="player-control-main"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="w-8 h-8" />
        ) : (
          <Play className="w-8 h-8 ml-1" />
        )}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        className="player-control disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next track"
      >
        <SkipForward className="w-6 h-6" />
      </button>
    </div>
  );
}
