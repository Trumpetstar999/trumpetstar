import { useLanguage } from '@/hooks/useLanguage';
import { AppUpdate, pickLocalized } from '@/lib/news';
import { BottomSheet } from './BottomSheet';

export function NewsSheet({ open, onClose, updates }: { open: boolean; onClose: () => void; updates: AppUpdate[] }) {
  const { t, language } = useLanguage();
  return (
    <BottomSheet open={open} onClose={onClose} title={t('home.news')}>
      <div className="max-h-[60dvh] overflow-y-auto -mx-1 px-1 pb-2 space-y-3">
        {updates.length === 0 && <p className="text-ts-muted">{t('home.newsEmpty')}</p>}
        {updates.map((u) => (
          <article key={u.id} className="rounded-2xl bg-ts-surface p-4">
            <p className="text-xs text-ts-muted">{new Date(u.created_at).toLocaleDateString(language)}</p>
            <h4 className="font-bold text-ts-ink mt-0.5">{pickLocalized(u.title_i18n, language)}</h4>
            <p className="text-sm text-ts-ink/80 mt-1 whitespace-pre-line">{pickLocalized(u.body_i18n, language)}</p>
            {u.link && /^(https:\/\/|\/)/.test(u.link) && (
              <a href={u.link} target={u.link.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer" className="inline-block mt-2 text-sm font-bold text-ts-deep underline">
                {t('home.newsMore')}
              </a>
            )}
          </article>
        ))}
      </div>
    </BottomSheet>
  );
}
