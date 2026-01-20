import { Minus, Plus } from 'lucide-react';

interface TunerControlsProps {
  referenceA4: number;
  onReferenceChange: (value: number) => void;
}

export function TunerControls({ referenceA4, onReferenceChange }: TunerControlsProps) {
  return (
    <div 
      className="px-4 py-2 flex items-center justify-between"
      style={{
        background: 'linear-gradient(180deg, #3d2d22 0%, #2e211a 100%)',
        borderTop: '1px solid #5c4535'
      }}
    >
      <span className="text-xs italic" style={{ color: '#a08060', fontFamily: 'serif' }}>
        Kammerton
      </span>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => referenceA4 > 430 && onReferenceChange(referenceA4 - 1)}
          disabled={referenceA4 <= 430}
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, #5c4535 0%, #4a3728 100%)',
            border: '1px solid #6d5545',
            color: referenceA4 <= 430 ? '#4a3728' : '#c4a882',
            opacity: referenceA4 <= 430 ? 0.5 : 1
          }}
        >
          <Minus className="w-3 h-3" />
        </button>
        
        <div 
          className="px-2 py-0.5 rounded text-center min-w-[60px]"
          style={{
            background: 'linear-gradient(180deg, #1a0505 0%, #0f0303 100%)',
            border: '1px solid #2d1515'
          }}
        >
          <span 
            className="text-sm font-mono"
            style={{ color: '#ff4444', textShadow: '0 0 6px #ff4444' }}
          >
            {referenceA4}
          </span>
          <span className="text-xs ml-0.5" style={{ color: '#992222' }}>Hz</span>
        </div>
        
        <button
          onClick={() => referenceA4 < 450 && onReferenceChange(referenceA4 + 1)}
          disabled={referenceA4 >= 450}
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, #5c4535 0%, #4a3728 100%)',
            border: '1px solid #6d5545',
            color: referenceA4 >= 450 ? '#4a3728' : '#c4a882',
            opacity: referenceA4 >= 450 ? 0.5 : 1
          }}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
