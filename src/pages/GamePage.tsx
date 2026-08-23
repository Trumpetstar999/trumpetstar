import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GameLanding } from '@/components/game/GameLanding';
import { GameSelect } from '@/components/game/GameSelect';
import { ToneForceMenu, type ToneForceView } from '@/components/game/toneforce/ToneForceMenu';

type Selected = 'select' | 'noterunner' | 'toneforce';

export function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { game?: Selected; toneForceView?: ToneForceView } | null;
  const [selected, setSelected] = useState<Selected>(state?.game ?? 'select');

  if (selected === 'noterunner') {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 pt-3">
          <button onClick={() => setSelected('select')} className="text-white/60 text-sm hover:text-white">
            ← Spielauswahl
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <GameLanding />
        </div>
      </div>
    );
  }

  if (selected === 'toneforce') {
    return <ToneForceMenu onBack={() => setSelected('select')} initialView={state?.toneForceView ?? 'menu'} />;
  }

  return (
    <GameSelect
      onSelect={(game) => {
        if (game === 'happybeginners') {
          navigate('/app/game/happybeginners/play');
          return;
        }
        setSelected(game);
      }}
    />
  );
}
