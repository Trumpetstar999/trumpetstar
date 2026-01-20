interface NoteDisplayProps {
  note: string;
  octave: number;
  cents: number;
  frequency: number;
  isActive: boolean;
}

export function NoteDisplay({ note, octave, cents, isActive }: NoteDisplayProps) {
  const displayNote = note.replace('♯', '#');
  
  return (
    <div className="flex flex-col items-center gap-3">
      {/* LED-style note display */}
      <div 
        className="relative px-6 py-3 rounded-lg"
        style={{
          background: 'linear-gradient(180deg, #2a0a0a 0%, #1a0505 100%)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
          border: '2px solid #3d2222'
        }}
      >
        {/* LED segments container */}
        <div className="flex items-baseline gap-1">
          <span 
            className="text-5xl font-bold tracking-wide"
            style={{ 
              color: isActive ? '#ff2222' : '#330808',
              textShadow: isActive ? '0 0 15px #ff2222, 0 0 30px #ff0000, 0 0 45px #cc0000' : 'none',
              fontFamily: '"Digital-7", "Courier New", monospace',
              letterSpacing: '0.1em'
            }}
          >
            {displayNote}
          </span>
          {isActive && octave > 0 && (
            <span 
              className="text-2xl font-bold"
              style={{ 
                color: '#ff2222',
                textShadow: '0 0 10px #ff2222, 0 0 20px #ff0000',
                fontFamily: '"Digital-7", "Courier New", monospace'
              }}
            >
              {octave}
            </span>
          )}
        </div>
      </div>
      
      {/* Cents deviation */}
      <div 
        className="px-4 py-2 rounded"
        style={{
          background: 'linear-gradient(180deg, #1a0505 0%, #0f0303 100%)',
          border: '1px solid #2d1515'
        }}
      >
        <span 
          className="text-lg font-mono"
          style={{ 
            color: isActive ? '#ff4444' : '#441111',
            textShadow: isActive ? '0 0 8px #ff4444' : 'none'
          }}
        >
          {isActive ? (cents >= 0 ? `+${cents}` : cents) : '---'} 
          <span className="text-sm opacity-70 ml-1">cent</span>
        </span>
      </div>
    </div>
  );
}
