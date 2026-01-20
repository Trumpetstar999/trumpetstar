import { cn } from '@/lib/utils';

interface NoteDisplayProps {
  note: string;
  octave: number;
  cents: number;
  frequency: number;
  isActive: boolean;
}

export function NoteDisplay({ note, octave, cents, frequency, isActive }: NoteDisplayProps) {
  const absCents = Math.abs(cents);
  
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Main Note */}
      <div className="relative flex items-baseline justify-center">
        <span 
          className={cn(
            "text-7xl font-bold tracking-tight transition-all duration-200",
            !isActive && "text-white/30",
            isActive && absCents <= 5 && "text-green-400",
            isActive && absCents > 5 && absCents <= 15 && "text-yellow-400",
            isActive && absCents > 15 && "text-red-400"
          )}
          style={{
            textShadow: isActive && absCents <= 5 
              ? '0 0 30px rgba(34, 197, 94, 0.5)' 
              : 'none'
          }}
        >
          {note}
        </span>
        {isActive && octave > 0 && (
          <span className="text-2xl font-medium text-white/50 ml-1">
            {octave}
          </span>
        )}
      </div>
      
      {/* Cents Display */}
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
        "bg-white/5 border border-white/10"
      )}>
        <span className={cn(
          "text-xl font-mono font-semibold transition-colors",
          !isActive && "text-white/30",
          isActive && cents < 0 && "text-blue-400",
          isActive && cents === 0 && "text-green-400",
          isActive && cents > 0 && "text-orange-400"
        )}>
          {isActive ? (cents >= 0 ? `+${cents}` : cents) : '—'}
        </span>
        <span className="text-sm text-white/40">cent</span>
      </div>
      
      {/* Frequency */}
      {isActive && frequency > 0 && (
        <span className="text-xs text-white/30 font-mono">
          {frequency.toFixed(1)} Hz
        </span>
      )}
    </div>
  );
}
