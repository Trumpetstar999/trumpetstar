import { useState, useEffect } from 'react';
import { Language, useLanguage } from '@/hooks/useLanguage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';

interface LanguageOption {
  code: Language;
  flag: string;
  name: string;
  nativeName: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'de', flag: '🇩🇪', name: 'German', nativeName: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', name: 'English', nativeName: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Spanish', nativeName: 'Español' },
];

interface LanguageSelectionDialogProps {
  open: boolean;
  onComplete: () => void;
}

export function LanguageSelectionDialog({ open, onComplete }: LanguageSelectionDialogProps) {
  const { language, setLanguage, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language>(language);

  const handleContinue = async () => {
    await setLanguage(selectedLang);
    localStorage.setItem('trumpetstar_onboarding_complete', 'true');
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md border-0 bg-gradient-to-b from-slate-900 to-slate-800"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <img 
              src={trumpetstarLogo} 
              alt="TrumpetStar" 
              className="h-16 w-auto"
            />
          </div>
          <DialogTitle className="text-2xl font-bold text-white">
            {t('onboarding.welcome')}
          </DialogTitle>
          <p className="text-white/60 mt-2">
            {t('onboarding.selectLanguage')}
          </p>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              onClick={() => setSelectedLang(option.code)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
                selectedLang === option.code
                  ? "bg-primary/20 border-2 border-primary ring-2 ring-primary/30"
                  : "bg-white/5 border-2 border-transparent hover:bg-white/10 hover:border-white/20"
              )}
            >
              <span className="text-4xl">{option.flag}</span>
              <div className="text-left flex-1">
                <p className="font-semibold text-white text-lg">
                  {option.nativeName}
                </p>
                <p className="text-sm text-white/50">
                  {option.name}
                </p>
              </div>
              {selectedLang === option.code && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <Button 
          onClick={handleContinue}
          className="w-full h-12 text-lg font-semibold mt-2"
        >
          {t('onboarding.continue')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
