import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { gamesCopy } from '@/i18n/games';
import noteRunnerPreview from '@/assets/noterunner-preview.png.asset.json';
import toneForcePreview from '@/assets/toneforce-preview.png.asset.json';
import snowtonePreview from '@/assets/snowtone/background.asset.json';
import snowtoneLogo from '@/assets/snowtone/selection-logo.png.asset.json';

interface Props {
  onSelect: (game: 'noterunner' | 'toneforce' | 'happybeginners' | 'snowtone') => void;
}

export function GameSelect({ onSelect }: Props) {
  const { language } = useLanguage();
  const copy = gamesCopy[language];
  const games = [
    { id: 'noterunner' as const, name: 'NoteRunner', image: noteRunnerPreview.url },
    { id: 'toneforce' as const, name: 'Tone Force', image: toneForcePreview.url },
    { id: 'happybeginners' as const, name: 'Happy Beginners', image: '/trompete/img/vogel-froh.png' },
    { id: 'snowtone' as const, name: 'Snowtone', image: snowtonePreview.url },
  ];
  return <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
    <h2 className="mb-6 text-center text-2xl font-bold text-ts-ink">{copy.choose}</h2>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {games.map((game) => <Button key={game.id} variant="ghost" onClick={() => onSelect(game.id)}
        className="group block h-auto min-w-0 overflow-hidden rounded-lg border border-border bg-ts-card p-0 text-left shadow-sm hover:bg-ts-card">
        <div className="relative aspect-video overflow-hidden bg-ts-surface">
          <img src={game.image} alt="" className={`h-full w-full ${game.id === 'happybeginners' ? 'object-contain p-4' : 'object-cover'} transition-transform motion-safe:group-hover:scale-[1.03]`} loading="lazy" />
          {game.id === 'snowtone' && <img src={snowtoneLogo.url} alt="Snowtone" className="absolute inset-0 h-full w-full object-contain p-6" loading="lazy" />}
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <span className="whitespace-normal text-xl font-bold text-ts-ink">{game.name}</span>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-ts-deep">{copy.start}<ChevronRight className="size-4" /></span>
        </div>
      </Button>)}
    </div>
  </div>;
}
