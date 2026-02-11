import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, ArrowLeft } from 'lucide-react';
import type { GameState } from '@/hooks/useGameLoop';

interface GameOverOverlayProps {
  gameState: GameState;
  onRestart: () => void;
  onBack: () => void;
}

export function GameOverOverlay({ gameState, onRestart, onBack }: GameOverOverlayProps) {
  if (!gameState.isGameOver) return null;

  const accuracy = gameState.totalCount > 0
    ? Math.round((gameState.correctCount / gameState.totalCount) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-sm mx-4 text-center rounded-2xl bg-[hsl(222,86%,22%)] border border-white/15 shadow-2xl p-8">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-[hsl(var(--reward-gold))]" />
        <h2 className="text-2xl font-bold text-white mb-1">Game Over</h2>
        <p className="text-white/60 text-sm mb-6">Gut gemacht!</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] text-white/50 uppercase">Score</div>
            <div className="text-xl font-bold text-white">{gameState.score}</div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] text-white/50 uppercase">Best Streak</div>
            <div className="text-xl font-bold text-gold-gradient">{gameState.bestStreak}</div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] text-white/50 uppercase">Level</div>
            <div className="text-xl font-bold text-white">{gameState.level}</div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] text-white/50 uppercase">Accuracy</div>
            <div className="text-xl font-bold text-white">{accuracy}%</div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 gap-2">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </Button>
          <Button onClick={onRestart} className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" /> Nochmal
          </Button>
        </div>
      </div>
    </div>
  );
}
