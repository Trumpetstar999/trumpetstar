import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TunerDialProps {
  cents: number;
  isActive: boolean;
}

export function TunerDial({ cents, isActive }: TunerDialProps) {
  // Clamp cents to -50 to +50 range
  const clampedCents = Math.max(-50, Math.min(50, cents));
  
  // Calculate needle rotation (-45° to +45° for the visual range)
  const needleRotation = (clampedCents / 50) * 45;
  
  // Determine color based on cents deviation
  const { needleColor, glowColor, status } = useMemo(() => {
    const absCents = Math.abs(clampedCents);
    if (absCents <= 5) {
      return { 
        needleColor: '#22c55e', 
        glowColor: 'rgba(34, 197, 94, 0.6)',
        status: 'perfect'
      };
    } else if (absCents <= 15) {
      return { 
        needleColor: '#eab308', 
        glowColor: 'rgba(234, 179, 8, 0.5)',
        status: 'close'
      };
    } else {
      return { 
        needleColor: '#ef4444', 
        glowColor: 'rgba(239, 68, 68, 0.5)',
        status: 'off'
      };
    }
  }, [clampedCents]);

  // Generate scale marks
  const scaleMarks = useMemo(() => {
    const marks = [];
    for (let i = -50; i <= 50; i += 10) {
      const angle = (i / 50) * 45 - 90; // -135° to -45° (top arc)
      const isMajor = i % 20 === 0;
      marks.push({ value: i, angle, isMajor });
    }
    return marks;
  }, []);

  return (
    <div className="relative w-full aspect-[2/1] max-w-[320px] mx-auto">
      {/* Dial Background */}
      <div className="absolute inset-0 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Background arc */}
          <defs>
            <linearGradient id="dialGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Dial face */}
          <path
            d="M 10 95 A 90 90 0 0 1 190 95"
            fill="url(#dialGradient)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />
          
          {/* Color zones */}
          <path
            d="M 45 95 A 55 55 0 0 1 60 50"
            fill="none"
            stroke="rgba(239, 68, 68, 0.4)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 60 50 A 55 55 0 0 1 85 32"
            fill="none"
            stroke="rgba(234, 179, 8, 0.4)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 85 32 A 55 55 0 0 1 115 32"
            fill="none"
            stroke="rgba(34, 197, 94, 0.5)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 115 32 A 55 55 0 0 1 140 50"
            fill="none"
            stroke="rgba(234, 179, 8, 0.4)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 140 50 A 55 55 0 0 1 155 95"
            fill="none"
            stroke="rgba(239, 68, 68, 0.4)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Scale marks */}
          {scaleMarks.map(({ value, angle, isMajor }) => {
            const radians = (angle * Math.PI) / 180;
            const innerRadius = isMajor ? 65 : 70;
            const outerRadius = 80;
            const x1 = 100 + innerRadius * Math.cos(radians);
            const y1 = 95 + innerRadius * Math.sin(radians);
            const x2 = 100 + outerRadius * Math.cos(radians);
            const y2 = 95 + outerRadius * Math.sin(radians);
            
            return (
              <g key={value}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth={isMajor ? 2 : 1}
                />
                {isMajor && (
                  <text
                    x={100 + 55 * Math.cos(radians)}
                    y={95 + 55 * Math.sin(radians)}
                    fill="rgba(255,255,255,0.6)"
                    fontSize="8"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {value > 0 ? `+${value}` : value}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Center text */}
          <text
            x="100"
            y="75"
            fill="rgba(255,255,255,0.3)"
            fontSize="6"
            textAnchor="middle"
          >
            CENTS
          </text>
          
          {/* Needle */}
          <g 
            transform={`rotate(${needleRotation}, 100, 95)`}
            style={{ 
              transition: isActive ? 'transform 0.1s ease-out' : 'none'
            }}
          >
            {/* Needle shadow/glow */}
            <line
              x1="100"
              y1="95"
              x2="100"
              y2="20"
              stroke={glowColor}
              strokeWidth="6"
              strokeLinecap="round"
              filter="url(#glow)"
              opacity={isActive ? 1 : 0.3}
            />
            {/* Needle body */}
            <line
              x1="100"
              y1="95"
              x2="100"
              y2="25"
              stroke={isActive ? needleColor : 'rgba(255,255,255,0.3)'}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Needle tip */}
            <polygon
              points="100,15 96,28 104,28"
              fill={isActive ? needleColor : 'rgba(255,255,255,0.3)'}
            />
          </g>
          
          {/* Center pivot */}
          <circle
            cx="100"
            cy="95"
            r="8"
            fill="#1a1a2e"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          <circle
            cx="100"
            cy="95"
            r="4"
            fill={isActive ? needleColor : 'rgba(255,255,255,0.2)'}
          />
        </svg>
      </div>
      
      {/* Status indicator */}
      <div className={cn(
        "absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium transition-all",
        !isActive && "opacity-50",
        status === 'perfect' && "bg-green-500/20 text-green-400",
        status === 'close' && "bg-yellow-500/20 text-yellow-400",
        status === 'off' && "bg-red-500/20 text-red-400"
      )}>
        {!isActive ? 'Warte...' : status === 'perfect' ? 'Perfekt!' : status === 'close' ? 'Fast!' : 'Korrigieren'}
      </div>
    </div>
  );
}
