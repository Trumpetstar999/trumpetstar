import { Button } from '@/components/ui/button';
import { useLanguage, useLocalizedContent } from '@/hooks/useLanguage';
import { ChevronRight, Film } from 'lucide-react';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';

interface TileLevel {
  id: string;
  title: string;
  title_en?: string | null;
  title_es?: string | null;
  difficulty?: string;
  previewThumbnail?: string;
  sections: { videos: { thumbnail: string }[] }[];
}

export function LevelGrid({ levels, onSelect }: { levels: TileLevel[]; onSelect: (id: string) => void }) {
  const { t } = useLanguage();
  const { getLocalizedField } = useLocalizedContent();

  return (
    <section className="p-4 sm:p-6" aria-label={t('levels.allLevels')}>
      <h3 className="mb-4 text-xl font-semibold text-foreground">{t('levels.allLevels')}</h3>
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
        {levels.map(level => {
          const title = getLocalizedField(level, 'title');
          const thumbnail = level.previewThumbnail || level.sections.flatMap(section => section.videos)[0]?.thumbnail;
          return (
            <Button
              key={level.id}
              variant="ghost"
              onClick={() => onSelect(level.id)}
              aria-label={title}
              data-level-tile={level.id}
              className="group block h-auto w-full min-w-0 overflow-hidden rounded-[8px] border border-border bg-secondary p-0 text-left whitespace-normal text-foreground shadow-card hover:bg-secondary hover:text-foreground motion-safe:transition-transform motion-safe:hover:scale-[1.02]"
            >
              <span className="relative block aspect-video w-full overflow-hidden bg-brand-blue-end">
                <img
                  src={thumbnail || trumpetstarLogo}
                  alt=""
                  loading="lazy"
                  className={thumbnail ? 'h-full w-full object-cover' : 'h-full w-full object-contain p-8'}
                  onError={event => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = trumpetstarLogo;
                    event.currentTarget.className = 'h-full w-full object-contain p-8';
                  }}
                />
              </span>
              <span className="flex min-h-20 items-center justify-between gap-3 p-4">
                <span className="min-w-0">
                  <span className="block break-words text-base font-semibold">{title}</span>
                  {level.difficulty && <span className="mt-1 block text-xs text-muted-foreground">{t(`levels.difficulty.${level.difficulty}`)}</span>}
                </span>
                <ChevronRight className="shrink-0 text-reward-gold" aria-hidden="true" />
              </span>
            </Button>
          );
        })}
      </div>
      {levels.length === 0 && <div className="flex items-center gap-2 py-12 text-muted-foreground"><Film />{t('levels.noLevels')}</div>}
    </section>
  );
}