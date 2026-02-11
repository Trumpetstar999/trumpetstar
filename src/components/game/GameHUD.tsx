import { useState, useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameState } from '@/hooks/useGameLoop';
import logoImg from '@/assets/logo-trumpetstar-game.png';
import { useLanguage } from '@/hooks/useLanguage';

interface GameHUDProps {
  gameState: GameState;
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const [pop, setPop] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setPop(true);
      setDisplay(value);
      prevRef.current = value;
      const t = setTimeout(() => setPop(false), 300);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span
      className={cn(
        'inline-block transition-transform duration-300',
        pop && 'animate-[bounce_0.4s_ease-out]',
        className
      )}
    >
      {display}
    </span>
  );
}

export function GameHUD({ gameState }: GameHUDProps) {
  const { language } = useLanguage();
  const isDE = language === 'de';

  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 glass">
      {/* Left: Logo + Level */}
      <div className="flex items-center gap-2">
        <img src={logoImg} alt="TrumpetStar" className="w-10 h-10 object-contain" />
        <span className="text-white font-bold text-sm">
          Level {gameState.level}
        </span>
      </div>

      {/* Center: Score + Streak */}
      <div className="flex items-center gap-4 text-center">
        <div>
          <div className="text-[10px] text-white/60 uppercase tracking-wider">
            {isDE ? 'Punkte' : 'Score'}
          </div>
          <AnimatedNumber value={gameState.score} className="text-white font-bold text-lg leading-tight" />
        </div>
        <div>
          <div className="text-[10px] text-white/60 uppercase tracking-wider">
            {isDE ? 'Treffer-Serie' : 'Streak'}
          </div>
          <AnimatedNumber value={gameState.streak} className="text-gold-gradient font-bold text-lg leading-tight" />
        </div>
      </div>

      {/* Right: Hearts */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <Heart
            key={i}
            className={cn(
              'w-6 h-6 transition-all duration-500 drop-shadow-md',
              i < gameState.lives
                ? 'text-red-400 fill-red-400 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]'
                : 'text-white/20 fill-white/10 scale-75'
            )}
            style={i < gameState.lives ? { animationDelay: `${i * 0.3}s` } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
