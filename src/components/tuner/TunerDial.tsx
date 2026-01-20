import { useMemo } from 'react';

interface TunerDialProps {
  cents: number;
  isActive: boolean;
}

export function TunerDial({ cents, isActive }: TunerDialProps) {
  // Clamp cents to -50 to +50 range
  const clampedCents = Math.max(-50, Math.min(50, cents));
  
  // Calculate needle rotation (-45° to +45° for the visual range)
  const needleRotation = (clampedCents / 50) * 40;

  // Generate scale marks
  const scaleMarks = useMemo(() => {
    const marks = [];
    // Main marks at -50, -40, -30, -20, -10, 0, +10, +20, +30, +40, +50
    for (let i = -50; i <= 50; i += 10) {
      const angle = (i / 50) * 40 - 90;
      const isMajor = i % 20 === 0;
      marks.push({ value: i, angle, isMajor });
    }
    return marks;
  }, []);

  // Minor tick marks
  const minorTicks = useMemo(() => {
    const ticks = [];
    for (let i = -50; i <= 50; i += 2) {
      if (i % 10 !== 0) {
        const angle = (i / 50) * 40 - 90;
        ticks.push({ angle });
      }
    }
    return ticks;
  }, []);

  return (
    <div className="relative w-full aspect-[1.6/1] max-w-[360px] mx-auto">
      {/* Vintage tuner frame */}
      <div 
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #4a3728 0%, #3d2d22 50%, #2e211a 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.4)',
          border: '2px solid #5c4535'
        }}
      >
        {/* Inner cream display area */}
        <div 
          className="absolute left-3 right-3 top-3 bottom-3 rounded overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #f5f0e1 0%, #e8e0cc 50%, #ddd5c0 100%)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.15), inset 0 -1px 0 rgba(255,255,255,0.5)'
          }}
        >
          {/* Dial SVG */}
          <svg viewBox="0 0 240 140" className="w-full h-full">
            {/* Decorative arc background */}
            <defs>
              <linearGradient id="dialBg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.03)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
              </linearGradient>
            </defs>
            
            {/* Center area accent */}
            <ellipse
              cx="120"
              cy="125"
              rx="100"
              ry="80"
              fill="url(#dialBg)"
            />
            
            {/* Minor tick marks */}
            {minorTicks.map(({ angle }, idx) => {
              const radians = (angle * Math.PI) / 180;
              const innerR = 85;
              const outerR = 90;
              const x1 = 120 + innerR * Math.cos(radians);
              const y1 = 120 + innerR * Math.sin(radians);
              const x2 = 120 + outerR * Math.cos(radians);
              const y2 = 120 + outerR * Math.sin(radians);
              
              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#8b7355"
                  strokeWidth="0.5"
                />
              );
            })}
            
            {/* Major scale marks */}
            {scaleMarks.map(({ value, angle, isMajor }) => {
              const radians = (angle * Math.PI) / 180;
              const innerR = isMajor ? 78 : 82;
              const outerR = 92;
              const textR = 68;
              const x1 = 120 + innerR * Math.cos(radians);
              const y1 = 120 + innerR * Math.sin(radians);
              const x2 = 120 + outerR * Math.cos(radians);
              const y2 = 120 + outerR * Math.sin(radians);
              const textX = 120 + textR * Math.cos(radians);
              const textY = 120 + textR * Math.sin(radians);
              
              return (
                <g key={value}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#2e211a"
                    strokeWidth={isMajor ? 2 : 1}
                  />
                  {isMajor && (
                    <text
                      x={textX}
                      y={textY + 1}
                      fill="#2e211a"
                      fontSize="9"
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
            <text
              x="25"
              y="100"
              fill="#5c4535"
              fontSize="8"
              style={{ fontFamily: 'serif', fontStyle: 'italic' }}
            >
              cent
            </text>
            
            {/* Center "Perfect" indicator - green zone */}
            <path
              d={`M ${120 + 45 * Math.cos(-95 * Math.PI / 180)} ${120 + 45 * Math.sin(-95 * Math.PI / 180)} 
                  A 45 45 0 0 1 ${120 + 45 * Math.cos(-85 * Math.PI / 180)} ${120 + 45 * Math.sin(-85 * Math.PI / 180)}`}
              fill="none"
              stroke="#22a855"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.6"
            />
            
            {/* Needle with smooth transition */}
            <g 
              style={{ 
                transform: `rotate(${needleRotation}deg)`,
                transformOrigin: '120px 120px',
                transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Needle shadow */}
              <line
                x1="120"
                y1="120"
                x2="120"
                y2="25"
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="4"
                strokeLinecap="round"
                transform="translate(1, 1)"
              />
              {/* Needle body */}
              <line
                x1="120"
                y1="115"
                x2="120"
                y2="30"
                stroke="#1a1410"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Needle point */}
              <polygon
                points="120,18 117,32 123,32"
                fill="#1a1410"
              />
            </g>
            
            {/* Center pivot */}
            <circle
              cx="120"
              cy="120"
              r="8"
              fill="#3d2d22"
              stroke="#5c4535"
              strokeWidth="2"
            />
            <circle
              cx="120"
              cy="120"
              r="4"
              fill="#8b7355"
            />
          </svg>
          
          {/* LED Note Display - positioned in the dial */}
          <div 
            className="absolute right-6 bottom-6 flex items-center gap-1 px-2 py-1 rounded"
            style={{
              background: 'radial-gradient(ellipse at center, #cc2233 0%, #991122 60%, #660011 100%)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 0 8px rgba(200,30,50,0.3)',
              border: '1px solid #440000'
            }}
          >
            <span 
              className="text-xl font-bold tracking-wider"
              style={{ 
                color: isActive ? '#ff3344' : '#661122',
                textShadow: isActive ? '0 0 10px #ff3344, 0 0 20px #ff3344' : 'none',
                fontFamily: 'monospace'
              }}
            >
              {isActive ? '●' : '○'}
            </span>
          </div>
        </div>
        
        {/* Status LEDs */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{
              background: isActive 
                ? 'radial-gradient(circle at 30% 30%, #ffaa44, #ff6600)' 
                : 'radial-gradient(circle at 30% 30%, #553322, #331100)',
              boxShadow: isActive ? '0 0 6px #ff6600' : 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
}
