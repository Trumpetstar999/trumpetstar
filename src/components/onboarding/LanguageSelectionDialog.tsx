import { useState } from 'react';
import { Language, useLanguage } from '@/hooks/useLanguage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';
import { Music, Sparkles, ArrowRight, User, Globe, Target } from 'lucide-react';

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

type SkillLevel = 'beginner' | 'intermediate';

interface LanguageSelectionDialogProps {
  open: boolean;
}

export function LanguageSelectionDialog({ open }: LanguageSelectionDialogProps) {
  const { language, setLanguage, t, completeOnboarding } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Save display name to profiles
      if (name.trim()) {
        await supabase
          .from('profiles')
          .update({ display_name: name.trim() })
          .eq('id', user.id);
      }

      // Save language and skill level
      await completeOnboarding(selectedLang, skillLevel);
    } catch (error) {
      console.error('[Onboarding] Error completing setup:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    return true;
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            s === step
              ? "w-8 bg-primary"
              : s < step
                ? "bg-primary/60"
                : "bg-white/20"
          )}
        />
      ))}
    </div>
  );

  const renderStepIcon = (stepNum: number) => {
    const icons = {
      1: <User className="w-5 h-5" />,
      2: <Globe className="w-5 h-5" />,
      3: <Target className="w-5 h-5" />,
    };
    return icons[stepNum as keyof typeof icons];
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-4">
          {renderStepIcon(1)}
        </div>
        <h2 className="text-2xl font-bold text-white">
          {t('onboarding.step1Title')}
        </h2>
        <p className="text-white/60 mt-2">
          {t('onboarding.step1Subtitle')}
        </p>
      </div>
      
      <Input
        type="text"
        placeholder={t('onboarding.namePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-14 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary"
        autoFocus
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-4">
          {renderStepIcon(2)}
        </div>
        <h2 className="text-2xl font-bold text-white">
          {t('onboarding.step2Title')}
        </h2>
        <p className="text-white/60 mt-2">
          {t('onboarding.step2Subtitle')}
        </p>
      </div>

      <div className="space-y-3">
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
            <span className="text-3xl">{option.flag}</span>
            <div className="text-left flex-1">
              <p className="font-semibold text-white">
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
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-4">
          {renderStepIcon(3)}
        </div>
        <h2 className="text-2xl font-bold text-white">
          {t('onboarding.step3Title')}
        </h2>
        <p className="text-white/60 mt-2">
          {t('onboarding.step3Subtitle')}
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setSkillLevel('beginner')}
          className={cn(
            "w-full flex items-center gap-4 p-5 rounded-xl transition-all duration-200",
            skillLevel === 'beginner'
              ? "bg-primary/20 border-2 border-primary ring-2 ring-primary/30"
              : "bg-white/5 border-2 border-transparent hover:bg-white/10 hover:border-white/20"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-white text-lg">
              {t('onboarding.skillBeginner')}
            </p>
            <p className="text-sm text-white/50">
              {t('onboarding.skillBeginnerDesc')}
            </p>
          </div>
          {skillLevel === 'beginner' && (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>

        <button
          onClick={() => setSkillLevel('intermediate')}
          className={cn(
            "w-full flex items-center gap-4 p-5 rounded-xl transition-all duration-200",
            skillLevel === 'intermediate'
              ? "bg-primary/20 border-2 border-primary ring-2 ring-primary/30"
              : "bg-white/5 border-2 border-transparent hover:bg-white/10 hover:border-white/20"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-white text-lg">
              {t('onboarding.skillIntermediate')}
            </p>
            <p className="text-sm text-white/50">
              {t('onboarding.skillIntermediateDesc')}
            </p>
          </div>
          {skillLevel === 'intermediate' && (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md border-0 bg-gradient-to-b from-slate-900 to-slate-800"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img 
            src={trumpetstarLogo} 
            alt="TrumpetStar" 
            className="h-12 w-auto"
          />
        </div>

        {renderStepIndicator()}

        {/* Step Content */}
        <div className="min-h-[280px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-12 border-white/20 text-white hover:bg-white/10"
            >
              {t('common.back')}
            </Button>
          )}
          
          {step < 3 ? (
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 h-12 text-lg font-semibold"
            >
              {t('common.next')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex-1 h-12 text-lg font-semibold"
            >
              {isSubmitting ? t('common.loading') : t('onboarding.letsStart')}
              {!isSubmitting && <Sparkles className="w-5 h-5 ml-2" />}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
