import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameState } from '@/hooks/useGameLoop';
import logoImg from '@/assets/logo-trumpetstar-game.png';

interface GameHUDProps {
  gameState: GameState;
}

export function GameHUD({ gameState }: GameHUDProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 glass">
      {/* Left: Logo + Level */}
      <div className="flex items-center gap-2">
        <img src={logoImg} alt="TrumpetStar" className="w-10 h-10 object-contain" />
        <span className="text-white font-bold text-sm">Lv.{gameState.level}</span>
      </div>

      {/* Center: Score + Streak */}
      <div className="flex items-center gap-4 text-center">
        <div>
          <div className="text-[10px] text-white/60 uppercase tracking-wider">Score</div>
          <div className="text-white font-bold text-lg leading-tight">{gameState.score}</div>
        </div>
        <div>
          <div className="text-[10px] text-white/60 uppercase tracking-wider">Streak</div>
          <div className="text-gold-gradient font-bold text-lg leading-tight">{gameState.streak}</div>
        </div>
      </div>

      {/* Right: Hearts */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <Heart
            key={i}
            className={cn(
              'w-5 h-5 transition-all duration-300',
              i < gameState.lives
                ? 'text-red-400 fill-red-400'
                : 'text-white/20 fill-white/10 scale-90'
            )}
          />
        ))}
      </div>
    </div>
  );
}
