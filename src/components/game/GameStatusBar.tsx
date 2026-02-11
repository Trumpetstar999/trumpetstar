import { Volume2, VolumeX, Pause, Play, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameStatusBarProps {
  sfxEnabled: boolean;
  isPaused: boolean;
  onToggleSfx: () => void;
  onTogglePause: () => void;
  onQuit: () => void;
}

export function GameStatusBar({
  sfxEnabled,
  isPaused,
  onToggleSfx,
  onTogglePause,
  onQuit,
}: GameStatusBarProps) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-4 px-4 py-3"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {/* Pause / Play button */}
      <button
        onClick={onTogglePause}
        className="w-14 h-14 rounded-full flex items-center justify-center bg-indigo-500/50 text-white/90 ring-2 ring-indigo-300/30 shadow-lg transition-all duration-200 active:scale-90"
      >
        {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
      </button>

      {/* SFX button */}
      <button
        onClick={onToggleSfx}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90',
          sfxEnabled
            ? 'bg-amber-500/50 text-amber-100 ring-2 ring-amber-300/30'
            : 'bg-gray-500/50 text-gray-300 ring-2 ring-gray-400/20'
        )}
      >
        {sfxEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
      </button>

      {/* Quit button */}
      <button
        onClick={onQuit}
        className="w-14 h-14 rounded-full flex items-center justify-center bg-rose-600/50 text-rose-200 ring-2 ring-rose-300/30 shadow-lg transition-all duration-200 active:scale-90"
      >
        <LogOut className="w-6 h-6" />
      </button>
    </div>
  );
}
