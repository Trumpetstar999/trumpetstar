import { Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { BottomSheet } from './BottomSheet';

export const HOME_LANGUAGES = [
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'sl', flag: '🇸🇮', name: 'Slovenščina' },
] as const;

export function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, language, setLanguage } = useLanguage();
  return (
    <BottomSheet open={open} onClose={onClose} title={t('home.lang')}>
      <div className="flex flex-col">
        {HOME_LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => { setLanguage(l.code); onClose(); }}
            className="flex items-center gap-3 min-h-12 px-2 rounded-2xl text-left text-base font-semibold active:bg-ts-surface"
          >
            <span className="text-2xl">{l.flag}</span>
            <span className="flex-1">{l.name}</span>
            {language === l.code && <Check className="w-5 h-5 text-ts-deep" />}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
