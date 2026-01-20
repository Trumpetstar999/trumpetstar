import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface NoteWheelProps {
  currentNoteIndex: number;
  isActive: boolean;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function NoteWheel({ currentNoteIndex, isActive }: NoteWheelProps) {
  // Generate ruler tick marks
  const rulerTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      ticks.push({
        isMajor: i % 5 === 0,
        index: i
      });
    }
    return ticks;
  }, []);

  // Calculate which notes to show (visible window)
  const getVisibleNotes = () => {
    const visible = [];
    for (let i = -2; i <= 2; i++) {
      const index = ((currentNoteIndex + i) % 12 + 12) % 12;
      visible.push({
        note: NOTES[index],
        offset: i,
        index
      });
    }
    return visible;
  };

  const visibleNotes = isActive && currentNoteIndex >= 0 
    ? getVisibleNotes() 
    : NOTES.slice(0, 5).map((note, i) => ({
        note,
        offset: i - 2,
        index: i
      }));

  return (
    <div 
      className="relative overflow-hidden rounded-lg"
      style={{
        background: 'linear-gradient(180deg, #4a3728 0%, #3d2d22 100%)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
        border: '2px solid #5c4535'
      }}
    >
      {/* "Note wheel" label */}
      <div 
        className="absolute top-1 left-3 text-xs italic z-10"
        style={{ color: '#c4a882', fontFamily: 'serif' }}
      >
        Note wheel
      </div>
      
      {/* Main display area */}
      <div 
        className="relative mx-2 my-6 rounded overflow-hidden"
        style={{
          background: '#f5f0e1',
          height: '60px'
        }}
      >
        {/* Gradient masks */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-12 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #f5f0e1 0%, transparent 100%)' }}
        />
        <div 
          className="absolute right-0 top-0 bottom-0 w-12 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(270deg, #f5f0e1 0%, transparent 100%)' }}
        />
        
        {/* Center highlight box */}
        <div 
          className="absolute left-1/2 top-0 bottom-0 w-14 -translate-x-1/2 z-10 pointer-events-none"
          style={{
            background: 'rgba(0,0,0,0.05)',
            borderLeft: '2px solid #3d2d22',
            borderRight: '2px solid #3d2d22'
          }}
        />
        
        {/* Notes */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ transition: 'transform 0.2s ease-out' }}
        >
          <div className="flex items-center">
            {visibleNotes.map(({ note, offset, index }) => (
              <div
                key={`${note}-${index}`}
                className={cn(
                  "flex-shrink-0 w-16 text-center transition-all duration-200"
                )}
                style={{
                  transform: offset === 0 ? 'scale(1.1)' : 'scale(1)',
                  opacity: Math.abs(offset) === 2 ? 0.4 : 1
                }}
              >
                <span 
                  className={cn(
                    "font-bold transition-all",
                    offset === 0 ? "text-2xl" : "text-lg"
                  )}
                  style={{ 
                    color: offset === 0 ? '#1a1410' : '#8b7355',
                    fontFamily: 'serif'
                  }}
                >
                  {note}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Ruler ticks at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-4 flex justify-center">
          <div className="flex">
            {rulerTicks.map(({ isMajor, index }) => (
              <div
                key={index}
                className="flex-shrink-0"
                style={{ width: '4px' }}
              >
                <div 
                  className="mx-auto"
                  style={{
                    width: '1px',
                    height: isMajor ? '10px' : '5px',
                    background: '#8b7355'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
