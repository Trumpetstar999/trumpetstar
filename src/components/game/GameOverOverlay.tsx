import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, RotateCcw, ArrowLeft, Check } from 'lucide-react';
import type { GameState } from '@/hooks/useGameLoop';

interface GameOverOverlayProps {
  gameState: GameState;
  onRestart: () => void;
  onBack: () => void;
  onSaveScore: (playerName: string) => Promise<void> | void;
}

const NAME_STORAGE_KEY = 'noterunner_player_name';

export function GameOverOverlay({ gameState, onRestart, onBack, onSaveScore }: GameOverOverlayProps) {
  const [playerName, setPlayerName] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (gameState.isGameOver) {
      setSaved(false);
      try {
        const stored = localStorage.getItem(NAME_STORAGE_KEY);
        if (stored) setPlayerName(stored);
      } catch {}
    }
  }, [gameState.isGameOver]);

  if (!gameState.isGameOver) return null;

  const accuracy = gameState.totalCount > 0
    ? Math.round((gameState.correctCount / gameState.totalCount) * 100)
    : 0;

  const handleSave = async () => {
    const trimmed = playerName.trim().slice(0, 40);
    setSaving(true);
    try {
      try { localStorage.setItem(NAME_STORAGE_KEY, trimmed); } catch {}
      await onSaveScore(trimmed);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-sm mx-4 text-center rounded-2xl bg-[hsl(222,86%,22%)] border border-white/15 shadow-2xl p-6">
        <Trophy className="w-14 h-14 mx-auto mb-3 text-[hsl(var(--reward-gold))]" />
        <h2 className="text-2xl font-bold text-white mb-1">Game Over</h2>
        <p className="text-white/60 text-sm mb-5">Gut gemacht!</p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="glass rounded-xl p-2.5">
            <div className="text-[10px] text-white/50 uppercase">Score</div>
            <div className="text-xl font-bold text-white">{gameState.score}</div>
          </div>
          <div className="glass rounded-xl p-2.5">
            <div className="text-[10px] text-white/50 uppercase">Best Streak</div>
            <div className="text-xl font-bold text-gold-gradient">{gameState.bestStreak}</div>
          </div>
          <div className="glass rounded-xl p-2.5">
            <div className="text-[10px] text-white/50 uppercase">Level</div>
            <div className="text-xl font-bold text-white">{gameState.level}</div>
          </div>
          <div className="glass rounded-xl p-2.5">
            <div className="text-[10px] text-white/50 uppercase">Accuracy</div>
            <div className="text-xl font-bold text-white">{accuracy}%</div>
          </div>
        </div>

        {!saved ? (
          <div className="mb-4 text-left">
            <Label htmlFor="player-name" className="text-white/70 text-xs">
              Spielername (optional)
            </Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="player-name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="z.B. Anna"
                maxLength={40}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
              <Button onClick={handleSave} disabled={saving} size="sm" className="shrink-0 gap-1">
                <Check className="w-4 h-4" />
                Speichern
              </Button>
            </div>
            <p className="text-white/40 text-[11px] mt-1.5">
              Damit mehrere Schüler auf einem Gerät unterschieden werden.
            </p>
          </div>
        ) : (
          <div className="mb-4 text-emerald-400 text-sm">✓ Score gespeichert</div>
        )}

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
