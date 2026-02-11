import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Settings, Trophy, Mic, Volume2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameHighscores } from './GameHighscores';
import { GameSettingsOverlay } from './GameSettingsOverlay';
import { useGameSettings } from '@/hooks/useGameSettings';

type View = 'landing' | 'highscores';

export function GameLanding() {
  const [view, setView] = useState<View>('landing');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, updateSettings } = useGameSettings();
  const navigate = useNavigate();

  if (view === 'highscores') {
    return (
      <div className="h-full overflow-y-auto pb-20">
        <div className="px-4 pt-2">
          <Button variant="ghost" size="sm" onClick={() => setView('landing')} className="text-white/70 mb-2">
            ← Zurück
          </Button>
        </div>
        <GameHighscores />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="flex flex-col items-center px-6 py-8 text-center space-y-6">
        {/* Title */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-white/70 mb-4">
            <Gamepad2 className="w-3.5 h-3.5" />
            TrumpetStar Game
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-gold-gradient">Note</span>Runner
          </h1>
          <p className="text-white/60 text-sm max-w-xs mx-auto">
            Notenlesen für Trompete – spielerisch mit Mikrofon in Echtzeit
          </p>
        </div>

        {/* Main buttons */}
        <div className="w-full max-w-xs space-y-3">
          <Button
            onClick={() => navigate('/game/play')}
            className="w-full h-14 text-lg font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(var(--reward-gold))]/90 text-[hsl(var(--gold-foreground))] rounded-2xl shadow-lg"
          >
            <Music className="w-5 h-5 mr-2" />
            Start
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              className="flex-1 gap-2 rounded-xl"
            >
              <Settings className="w-4 h-4" /> Einstellungen
            </Button>
            <Button
              variant="outline"
              onClick={() => setView('highscores')}
              className="flex-1 gap-2 rounded-xl"
            >
              <Trophy className="w-4 h-4" /> Highscores
            </Button>
          </div>
        </div>

        {/* Info panel */}
        <div className="w-full max-w-xs glass rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-start gap-3">
            <Mic className="w-5 h-5 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-xs font-medium">Mikrofonzugriff erforderlich</p>
              <p className="text-white/50 text-[11px]">Das Spiel erkennt deine Trompetentöne in Echtzeit.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Volume2 className="w-5 h-5 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-xs font-medium">SFX standardmäßig aus</p>
              <p className="text-white/50 text-[11px]">Sound-Effekte können die Pitch-Erkennung stören.</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="w-full max-w-xs text-left">
          <h3 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">So funktioniert's</h3>
          <ul className="space-y-1.5 text-white/50 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--reward-gold))] font-bold">1.</span>
              Noten wandern von rechts über das Notensystem
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--reward-gold))] font-bold">2.</span>
              Spiele die richtige Note auf deiner Trompete
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--reward-gold))] font-bold">3.</span>
              Sammle Punkte und baue deinen Streak aus!
            </li>
          </ul>
        </div>
      </div>

      <GameSettingsOverlay
        open={settingsOpen}
        settings={settings}
        onUpdate={updateSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
