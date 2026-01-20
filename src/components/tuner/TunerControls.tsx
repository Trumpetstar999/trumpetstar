import { Minus, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TunerControlsProps {
  referenceA4: number;
  onReferenceChange: (value: number) => void;
}

export function TunerControls({ referenceA4, onReferenceChange }: TunerControlsProps) {
  const handleDecrement = () => {
    if (referenceA4 > 430) {
      onReferenceChange(referenceA4 - 1);
    }
  };

  const handleIncrement = () => {
    if (referenceA4 < 450) {
      onReferenceChange(referenceA4 + 1);
    }
  };

  const handleReset = () => {
    onReferenceChange(440);
  };

  return (
    <div className="px-6 py-4 border-t border-white/10 bg-black/20">
      <div className="flex items-center justify-between">
        {/* Label */}
        <div className="text-sm text-white/50">
          Kammerton
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Decrement */}
          <button
            onClick={handleDecrement}
            disabled={referenceA4 <= 430}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white",
              "disabled:opacity-30 disabled:cursor-not-allowed"
            )}
          >
            <Minus className="w-4 h-4" />
          </button>
          
          {/* Value Display */}
          <div className="min-w-[80px] text-center">
            <span className="text-lg font-mono font-semibold text-white">
              {referenceA4}
            </span>
            <span className="text-sm text-white/50 ml-1">Hz</span>
          </div>
          
          {/* Increment */}
          <button
            onClick={handleIncrement}
            disabled={referenceA4 >= 450}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white",
              "disabled:opacity-30 disabled:cursor-not-allowed"
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
          
          {/* Reset */}
          <button
            onClick={handleReset}
            disabled={referenceA4 === 440}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all ml-2",
              "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white",
              "disabled:opacity-30 disabled:cursor-not-allowed"
            )}
            title="Zurücksetzen auf 440 Hz"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Slider */}
      <div className="mt-3">
        <input
          type="range"
          min={430}
          max={450}
          value={referenceA4}
          onChange={(e) => onReferenceChange(parseInt(e.target.value))}
          className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
        />
        <div className="flex justify-between mt-1 text-xs text-white/30">
          <span>430</span>
          <span>440</span>
          <span>450</span>
        </div>
      </div>
    </div>
  );
}
