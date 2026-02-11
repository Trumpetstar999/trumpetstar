import { Mic, MicOff, Volume2, VolumeX, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameStatusBarProps {
  isListening: boolean;
  detectedNote: string | null;
  mappedNote: string | null;
  confidence: number;
  sfxEnabled: boolean;
  onToggleMic: () => void;
  onToggleSfx: () => void;
  onOpenSettings: () => void;
}

export function GameStatusBar({
  isListening,
  detectedNote,
  mappedNote,
  confidence,
  sfxEnabled,
  onToggleMic,
  onToggleSfx,
  onOpenSettings,
}: GameStatusBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 glass">
      {/* Mic toggle */}
      <button
        onClick={onToggleMic}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all',
          isListening ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        )}
      >
        {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        <span>{isListening ? 'ON' : 'OFF'}</span>
      </button>

      {/* Detected pitch info */}
      <div className="flex items-center gap-3 text-xs text-white/70">
        <div className="text-center">
          <div className="text-[9px] text-white/40 uppercase">Concert</div>
          <div className="text-white font-mono font-bold">{detectedNote ?? '—'}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-white/40 uppercase">Written</div>
          <div className="text-gold-gradient font-mono font-bold">{mappedNote ?? '—'}</div>
        </div>
        {/* Confidence bar */}
        <div className="w-10 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all duration-100"
            style={{ width: `${Math.min(100, confidence * 5000)}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button onClick={onToggleSfx} className="p-1.5 text-white/60 hover:text-white transition-colors">
          {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        <button onClick={onOpenSettings} className="p-1.5 text-white/60 hover:text-white transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
