import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MenuButton } from '@/components/game/toneforce/MenuButton';
import { ToneForceCalibration } from '@/components/game/toneforce/ToneForceCalibration';
import { ToneForcePractice } from '@/components/game/toneforce/ToneForcePractice';
import { ToneForceChords } from '@/components/game/toneforce/ToneForceChords';
import { ToneForceHighscores } from '@/components/game/toneforce/ToneForceHighscores';
import { ToneForceSettings } from '@/components/game/toneforce/ToneForceSettings';
import { useChordSettings } from '@/hooks/toneforce/useChordSettings';
import { useDailyUsage } from '@/hooks/useDailyUsage';
import { DailyLimitOverlay } from '@/components/premium/DailyLimitOverlay';
import { useTfT } from '@/i18n/toneforce';
import shipImage from '@/assets/toneforce/player_ship.png';

export type ToneForceView = 'menu' | 'play' | 'practice' | 'chords' | 'highscores' | 'settings';

interface Props {
  onBack: () => void;
  initialView?: ToneForceView;
}

export function ToneForceMenu({ onBack, initialView = 'menu' }: Props) {
  const t = useTfT();
  const navigate = useNavigate();
  const [view, setView] = useState<ToneForceView>(initialView);
  const [limitOpen, setLimitOpen] = useState(false);
  const { chord } = useChordSettings();
  const { canStartGame, recordGameStart } = useDailyUsage();

  const startGame = async () => {
    if (!canStartGame()) {
      setLimitOpen(true);
      return;
    }
    const allowed = await recordGameStart();
    if (allowed) navigate('/app/game/toneforce/play');
    else setLimitOpen(true);
  };

  const content = () => {
    switch (view) {
      case 'play':
        return <ToneForceCalibration onStartGame={startGame} />;
      case 'practice':
        return <ToneForcePractice />;
      case 'chords':
        return <ToneForceChords />;
      case 'highscores':
        return <ToneForceHighscores />;
      case 'settings':
        return <ToneForceSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button
          onClick={() => (view === 'menu' ? onBack() : setView('menu'))}
          className="inline-flex items-center gap-1.5 text-white/60 text-sm hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {view === 'menu' ? 'Spielauswahl' : t('common.menu').replace('← ', '')}
        </button>

        {view === 'menu' ? (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <img src={shipImage} alt={t('home.shipAlt')} className="h-24 w-auto mx-auto mb-3" />
              <h1 className="text-3xl font-bold text-white">
                <span className="text-gold-gradient">Tone</span> Force
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {t('chords.assignment', { left: chord.left, fire: chord.fire, right: chord.right })}
              </p>
            </div>

            <div className="space-y-2.5">
              <MenuButton variant="primary" onClick={() => setView('play')} subtitle={t('menu.playSub')}>
                {t('menu.play')}
              </MenuButton>
              <MenuButton onClick={() => setView('practice')} subtitle={t('menu.practiceSub')}>
                {t('menu.practice')}
              </MenuButton>
              <MenuButton onClick={() => setView('chords')} subtitle={t('menu.chordsSub')}>
                {t('menu.chords')}
              </MenuButton>
              <MenuButton onClick={() => setView('highscores')} subtitle={t('menu.highscoresSub')}>
                {t('menu.highscores')}
              </MenuButton>
              <MenuButton onClick={() => setView('settings')} subtitle={t('menu.settingsSub')}>
                {t('menu.settings')}
              </MenuButton>
            </div>
          </div>
        ) : (
          content()
        )}
      </div>

      <DailyLimitOverlay open={limitOpen} type="game" onClose={() => setLimitOpen(false)} />
    </div>
  );
}
