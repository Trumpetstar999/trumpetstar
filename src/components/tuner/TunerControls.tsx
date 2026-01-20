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
    <div 
      className="px-6 py-4"
      style={{
        background: 'linear-gradient(180deg, #3d2d22 0%, #2e211a 100%)',
        borderTop: '1px solid #5c4535'
      }}
    >
      <div className="flex items-center justify-between">
        {/* Label */}
        <div 
          className="text-sm italic"
          style={{ color: '#c4a882', fontFamily: 'serif' }}
        >
          Kammerton
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Decrement */}
          <button
            onClick={handleDecrement}
            disabled={referenceA4 <= 430}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all"
            )}
            style={{
              background: 'linear-gradient(180deg, #5c4535 0%, #4a3728 100%)',
              border: '1px solid #6d5545',
              color: referenceA4 <= 430 ? '#4a3728' : '#c4a882',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              opacity: referenceA4 <= 430 ? 0.5 : 1
            }}
          >
            <Minus className="w-4 h-4" />
          </button>
          
          {/* Value Display */}
          <div 
            className="min-w-[90px] text-center px-3 py-1 rounded"
            style={{
              background: 'linear-gradient(180deg, #1a0505 0%, #0f0303 100%)',
              border: '1px solid #2d1515'
            }}
          >
            <span 
              className="text-lg font-mono font-semibold"
              style={{ 
                color: '#ff4444',
                textShadow: '0 0 8px #ff4444'
              }}
            >
              {referenceA4}
            </span>
            <span 
              className="text-sm ml-1"
              style={{ color: '#992222' }}
            >
              Hz
            </span>
          </div>
          
          {/* Increment */}
          <button
            onClick={handleIncrement}
            disabled={referenceA4 >= 450}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all"
            )}
            style={{
              background: 'linear-gradient(180deg, #5c4535 0%, #4a3728 100%)',
              border: '1px solid #6d5545',
              color: referenceA4 >= 450 ? '#4a3728' : '#c4a882',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              opacity: referenceA4 >= 450 ? 0.5 : 1
            }}
          >
            <Plus className="w-4 h-4" />
          </button>
          
          {/* Reset */}
          <button
            onClick={handleReset}
            disabled={referenceA4 === 440}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all ml-2"
            )}
            style={{
              background: 'linear-gradient(180deg, #5c4535 0%, #4a3728 100%)',
              border: '1px solid #6d5545',
              color: referenceA4 === 440 ? '#4a3728' : '#c4a882',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              opacity: referenceA4 === 440 ? 0.5 : 1
            }}
            title="Zurücksetzen auf 440 Hz"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
