import { cn } from '@/lib/utils';

interface NoteWheelProps {
  currentNoteIndex: number;
  isActive: boolean;
}

const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

export function NoteWheel({ currentNoteIndex, isActive }: NoteWheelProps) {
  // Calculate which notes to show (5 visible: 2 before, current, 2 after)
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

  const visibleNotes = isActive && currentNoteIndex >= 0 ? getVisibleNotes() : NOTES.slice(0, 5).map((note, i) => ({
    note,
    offset: i - 2,
    index: i
  }));

  return (
    <div className="relative overflow-hidden py-2">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#16213e] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#16213e] to-transparent z-10 pointer-events-none" />
      
      {/* Center highlight */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-full bg-white/5 rounded-lg border border-white/10 pointer-events-none" />
      
      {/* Notes container */}
      <div 
        className="flex items-center justify-center gap-1 transition-transform duration-200 ease-out"
        style={{
          transform: isActive && currentNoteIndex >= 0 
            ? 'translateX(0)' 
            : 'translateX(0)'
        }}
      >
        {visibleNotes.map(({ note, offset, index }) => (
          <div
            key={`${note}-${index}`}
            className={cn(
              "flex-shrink-0 w-14 py-2 text-center transition-all duration-200",
              offset === 0 && isActive && "scale-110",
              offset === 0 ? "text-white font-bold text-lg" : "text-white/40 text-sm",
              Math.abs(offset) === 2 && "opacity-30"
            )}
          >
            {note}
          </div>
        ))}
      </div>
    </div>
  );
}
