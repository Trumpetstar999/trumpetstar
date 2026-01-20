import { useMemo } from 'react';

interface TunerDialProps {
  cents: number;
  isActive: boolean;
  note: string;
  octave: number;
}

export function TunerDial({ cents, isActive, note, octave }: TunerDialProps) {
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const needleRotation = (clampedCents / 50) * 40;

  const scaleMarks = useMemo(() => {
    const marks = [];
    for (let i = -50; i <= 50; i += 10) {
      const angle = (i / 50) * 40 - 90;
      const isMajor = i % 20 === 0;
      marks.push({ value: i, angle, isMajor });
    }
    return marks;
  }, []);

  const minorTicks = useMemo(() => {
    const ticks = [];
    for (let i = -50; i <= 50; i += 5) {
      if (i % 10 !== 0) {
        const angle = (i / 50) * 40 - 90;
        ticks.push({ angle });
      }
    }
    return ticks;
  }, []);

  const displayNote = note.replace('♯', '#');

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      {/* Vintage tuner frame */}
      <div 
        className="relative rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #4a3728 0%, #3d2d22 50%, #2e211a 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3)',
          border: '2px solid #5c4535',
          aspectRatio: '2.2 / 1'
        }}
      >
        {/* Inner cream display area */}
        <div 
          className="absolute left-2 right-2 top-2 bottom-2 rounded overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #f5f0e1 0%, #e8e0cc 50%, #ddd5c0 100%)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.12)'
          }}
        >
          {/* Dial SVG */}
          <svg viewBox="0 0 220 95" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
            {/* Minor tick marks */}
            {minorTicks.map(({ angle }, idx) => {
              const radians = (angle * Math.PI) / 180;
              const innerR = 70;
              const outerR = 75;
              const x1 = 110 + innerR * Math.cos(radians);
              const y1 = 90 + innerR * Math.sin(radians);
              const x2 = 110 + outerR * Math.cos(radians);
              const y2 = 90 + outerR * Math.sin(radians);
              
              return (
                <line
                  key={idx}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#8b7355"
                  strokeWidth="0.5"
                />
              );
            })}
            
            {/* Major scale marks */}
            {scaleMarks.map(({ value, angle, isMajor }) => {
              const radians = (angle * Math.PI) / 180;
              const innerR = isMajor ? 62 : 68;
              const outerR = 76;
              const textR = 52;
              const x1 = 110 + innerR * Math.cos(radians);
              const y1 = 90 + innerR * Math.sin(radians);
              const x2 = 110 + outerR * Math.cos(radians);
              const y2 = 90 + outerR * Math.sin(radians);
              const textX = 110 + textR * Math.cos(radians);
              const textY = 90 + textR * Math.sin(radians);
              
              return (
                <g key={value}>
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="#2e211a"
                    strokeWidth={isMajor ? 1.5 : 1}
                  />
                  {isMajor && (
                    <text
                      x={textX} y={textY + 1}
                      fill="#2e211a"
                      fontSize="7"
                      fontWeight="500"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontFamily: 'serif' }}
                    >
                      {value > 0 ? `+${value}` : value}
                    </text>
                  )}
                </g>
              );
            })}
            
            {/* "cent" label */}
            <text x="18" y="78" fill="#5c4535" fontSize="6" style={{ fontFamily: 'serif', fontStyle: 'italic' }}>
              cent
            </text>
            
            {/* Center green zone */}
            <path
              d={`M ${110 + 38 * Math.cos(-94 * Math.PI / 180)} ${90 + 38 * Math.sin(-94 * Math.PI / 180)} 
                  A 38 38 0 0 1 ${110 + 38 * Math.cos(-86 * Math.PI / 180)} ${90 + 38 * Math.sin(-86 * Math.PI / 180)}`}
              fill="none"
              stroke="#22a855"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.5"
            />
            
            {/* Needle */}
            <g 
              style={{ 
                transform: `rotate(${needleRotation}deg)`,
                transformOrigin: '110px 90px',
                transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <line
                x1="110" y1="88" x2="110" y2="18"
                stroke="#1a1410"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <polygon points="110,12 107,22 113,22" fill="#1a1410" />
            </g>
            
            {/* Center pivot */}
            <circle cx="110" cy="90" r="6" fill="#3d2d22" stroke="#5c4535" strokeWidth="1.5" />
            <circle cx="110" cy="90" r="3" fill="#8b7355" />
          </svg>
          
          {/* LED Note Display - integrated */}
          <div 
            className="absolute right-3 bottom-2 flex items-baseline gap-0.5 px-2 py-1 rounded"
            style={{
              background: 'radial-gradient(ellipse at center, #cc2233 0%, #991122 60%, #660011 100%)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
              border: '1px solid #440000'
            }}
          >
            <span 
              className="text-lg font-bold"
              style={{ 
                color: isActive ? '#ff3344' : '#661122',
                textShadow: isActive ? '0 0 8px #ff3344' : 'none',
                fontFamily: 'monospace'
              }}
            >
              {displayNote}
            </span>
            {isActive && octave > 0 && (
              <span 
                className="text-xs"
                style={{ 
                  color: '#ff3344',
                  textShadow: '0 0 6px #ff3344',
                  fontFamily: 'monospace'
                }}
              >
                {octave}
              </span>
            )}
          </div>
          
          {/* Cents display */}
          <div 
            className="absolute left-3 bottom-2 text-xs font-mono"
            style={{ color: '#5c4535' }}
          >
            {isActive ? (cents >= 0 ? `+${cents}` : cents) : '—'} ct
          </div>
        </div>
        
        {/* Status LED */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
          <div 
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: isActive 
                ? 'radial-gradient(circle at 30% 30%, #ffaa44, #ff6600)' 
                : 'radial-gradient(circle at 30% 30%, #553322, #331100)',
              boxShadow: isActive ? '0 0 4px #ff6600' : 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
}
