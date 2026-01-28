import { Language, useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface LanguageTabsProps {
  /** Current selected content language for filtering */
  selectedLanguage: Language;
  /** Callback when a language tab is clicked */
  onLanguageChange: (lang: Language) => void;
  /** Additional CSS classes */
  className?: string;
  /** Variant: default or compact */
  variant?: 'default' | 'compact';
}

const LANGUAGE_FLAGS: Record<Language, string> = {
  de: '🇩🇪',
  en: '🇬🇧',
  es: '🇪🇸',
};

const LANGUAGE_LABELS: Record<Language, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
};

export function LanguageTabs({ 
  selectedLanguage, 
  onLanguageChange, 
  className,
  variant = 'default'
}: LanguageTabsProps) {
  const languages: Language[] = ['de', 'en', 'es'];

  return (
    <div className={cn(
      "flex rounded-lg p-1 bg-white/10",
      variant === 'compact' ? 'gap-0.5' : 'gap-1',
      className
    )}>
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => onLanguageChange(lang)}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md transition-all duration-200",
            variant === 'compact' 
              ? 'px-2 py-1 text-xs' 
              : 'px-3 py-1.5 text-sm',
            selectedLanguage === lang
              ? 'bg-white/20 text-white font-medium shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          )}
        >
          <span>{LANGUAGE_FLAGS[lang]}</span>
          {variant !== 'compact' && (
            <span>{LANGUAGE_LABELS[lang]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// Simpler tab bar for light backgrounds (admin, settings)
export function LanguageTabsLight({ 
  selectedLanguage, 
  onLanguageChange, 
  className 
}: LanguageTabsProps) {
  const languages: Language[] = ['de', 'en', 'es'];

  return (
    <div className={cn(
      "flex rounded-lg p-1 bg-muted/50 border border-border",
      className
    )}>
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => onLanguageChange(lang)}
          className={cn(
            "flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all duration-200",
            selectedLanguage === lang
              ? 'bg-background text-foreground font-medium shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <span>{LANGUAGE_FLAGS[lang]}</span>
          <span>{LANGUAGE_LABELS[lang]}</span>
        </button>
      ))}
    </div>
  );
}
