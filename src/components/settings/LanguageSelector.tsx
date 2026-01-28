import { useState } from 'react';
import { Language, useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGE_OPTIONS: { code: Language; flag: string; name: string }[] = [
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
];

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const currentLang = LANGUAGE_OPTIONS.find(l => l.code === language);

  const handleSelect = async (lang: Language) => {
    await setLanguage(lang);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 h-12"
        >
          <Globe className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1 text-left">
            <div className="text-sm font-medium">{t('profile.language')}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{currentLang?.flag}</span>
              <span>{currentLang?.name}</span>
            </div>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('profile.selectLanguage')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              onClick={() => handleSelect(option.code)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-200",
                language === option.code
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-muted/50 border-2 border-transparent hover:bg-muted hover:border-border"
              )}
            >
              <span className="text-2xl">{option.flag}</span>
              <span className="font-medium flex-1 text-left">{option.name}</span>
              {language === option.code && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
