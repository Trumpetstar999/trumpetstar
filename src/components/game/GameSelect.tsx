import { Gamepad2, Music, Rocket, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import shipImage from '@/assets/toneforce/player_ship.png';

interface Props {
  onSelect: (game: 'noterunner' | 'toneforce') => void;
}

const CARD =
  'group relative flex-1 w-full overflow-hidden rounded-3xl glass p-6 text-left transition-transform hover:-translate-y-1';

export function GameSelect({ onSelect }: Props) {
  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-white/70 mb-4">
            <Gamepad2 className="w-3.5 h-3.5" />
            TrumpetStar Games
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Wähle dein <span className="text-gold-gradient">Spiel</span>
          </h1>
          <p className="text-white/60 text-sm">Beide Spiele erkennen deine Trompetentöne in Echtzeit.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-5">
          <button className={CARD} onClick={() => onSelect('noterunner')}>
            <div className="flex items-center justify-center h-32 mb-4 rounded-2xl bg-white/5">
              <Music className="w-16 h-16 text-[hsl(var(--reward-gold))]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              <span className="text-gold-gradient">Note</span>Runner
            </h2>
            <p className="text-white/60 text-sm mb-4">
              Notenlesen trainieren: Noten wandern über das Notensystem – spiele sie richtig und baue deinen Streak aus.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--reward-gold))]">
              Starten <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>

          <button className={CARD} onClick={() => onSelect('toneforce')}>
            <div className="flex items-center justify-center h-32 mb-4 rounded-2xl bg-white/5 overflow-hidden">
              <img src={shipImage} alt="Tone Force Raumschiff" className="h-28 w-auto object-contain" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              <span className="text-gold-gradient">Tone</span> Force
            </h2>
            <p className="text-white/60 text-sm mb-4">
              Weltraum-Shooter: Steuere dein Raumschiff mit einem Dreiklang – links, feuern, rechts.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--reward-gold))]">
              Starten <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" className="text-white/40 text-xs gap-2" disabled>
            <Rocket className="w-3.5 h-3.5" /> Weitere Spiele folgen
          </Button>
        </div>
      </div>
    </div>
  );
}
