import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Mic, Volume2, Music, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameHighscores } from './GameHighscores';
import { GameSettingsInline } from './GameSettingsInline';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useDailyUsage } from '@/hooks/useDailyUsage';
import { DailyLimitOverlay } from '@/components/premium/DailyLimitOverlay';

type View = 'landing' | 'highscores';

export function GameLanding() {
  const [view, setView] = useState<View>('landing');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const { settings, updateSettings } = useGameSettings();
  const { canStartGame, recordGameStart } = useDailyUsage();
  const navigate = useNavigate();

  const handleStartGame = async () => {
    if (!canStartGame()) {
      setLimitOpen(true);
      return;
    }
    const allowed = await recordGameStart();
    if (allowed) {
      navigate('/app/game/play');
    } else {
      setLimitOpen(true);
    }
  };

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
      {/* Main layout: two-column on wide screens, stacked on small */}
      <div className="flex flex-col lg:flex-row gap-5 px-4 py-6 items-start max-w-3xl mx-auto">

        {/* LEFT: Title + Start + Info */}
        <div className="flex flex-col items-center text-center space-y-5 lg:w-72 shrink-0 w-full">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-white/70 mb-4">
              <Gamepad2 className="w-3.5 h-3.5" />
              TrumpetStar Game
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-gold-gradient">Note</span>Runner
            </h1>
            <p className="text-white/60 text-sm">
              Notenlesen für Trompete – spielerisch mit Mikrofon in Echtzeit
            </p>
          </div>

          {/* Main buttons */}
          <div className="w-full space-y-3">
            <Button
              onClick={handleStartGame}
              className="w-full h-14 text-lg font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(var(--reward-gold))]/90 text-[hsl(var(--gold-foreground))] rounded-2xl shadow-lg"
            >
              <Music className="w-5 h-5 mr-2" />
              Start
            </Button>
            <Button
              variant="outline"
              onClick={() => setView('highscores')}
              className="w-full gap-2 rounded-xl"
            >
              <Trophy className="w-4 h-4" /> Highscores
            </Button>
          </div>

          {/* Info panel */}
          <div className="w-full glass rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-start gap-3">
              <Mic className="w-5 h-5 text-[hsl(var(--reward-gold))] shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-xs font-medium">Mikrofonzugriff erforderlich</p>
                <p className="text-white/50 text-[11px]">Das Spiel erkennt deine Trompetentöne in Echtzeit.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Volume2 className="w-5 h-5 text-[hsl(var(--reward-gold))] shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-xs font-medium">SFX standardmäßig aus</p>
                <p className="text-white/50 text-[11px]">Sound-Effekte können die Pitch-Erkennung stören.</p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="w-full text-left">
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

          {/* Mobile settings toggle */}
          <button
            onClick={() => setSettingsOpen(v => !v)}
            className="lg:hidden w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-white/60 text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span>Einstellungen</span>
            {settingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* RIGHT: Settings inline — always visible on desktop, toggleable on mobile */}
        <div className={`flex-1 w-full ${settingsOpen ? 'block' : 'hidden'} lg:block`}>
          <GameSettingsInline settings={settings} onUpdate={updateSettings} />
        </div>
      </div>

      <DailyLimitOverlay
        open={limitOpen}
        type="game"
        onClose={() => setLimitOpen(false)}
      />
    </div>
  );
}
