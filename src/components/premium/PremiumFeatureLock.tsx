import { Lock, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMembership } from '@/hooks/useMembership';

type FeatureType = 'classroom' | 'feedback' | 'teacher';

interface FeatureContent {
  title: string;
  description: string;
}

const FEATURE_CONTENT: Record<FeatureType, FeatureContent> = {
  classroom: {
    title: 'Live-Unterricht & gemeinsames Musizieren',
    description: 'Im Klassenzimmer triffst du deinen Lehrer und andere Musiker live. Ihr könnt gemeinsam spielen, Fragen klären und gezielt an deinem Fortschritt arbeiten.',
  },
  feedback: {
    title: 'Persönliches Feedback zu deinen Aufnahmen',
    description: 'Mit Premium kannst du deine Aufnahmen direkt an deinen Lehrer oder den Admin senden und gezieltes Feedback mit Zeitmarken und Antwort-Videos erhalten.',
  },
  teacher: {
    title: 'Unterrichten & Feedback geben',
    description: 'Der Lehrer-Modus ermöglicht dir, Schüler zu begleiten, Videos zu kommentieren und Unterricht im Klassenzimmer zu geben.',
  },
};

interface PremiumFeatureLockProps {
  feature: FeatureType;
  className?: string;
}

export function PremiumFeatureLock({ feature, className = '' }: PremiumFeatureLockProps) {
  const { getUpgradeLink, isLoading } = useMembership();
  const content = FEATURE_CONTENT[feature];
  const premiumLink = getUpgradeLink('PREMIUM');

  const handleUpgrade = () => {
    if (premiumLink) {
      window.open(premiumLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-[60vh] p-4 ${className}`}>
      <div className="bg-card border border-border rounded-2xl p-8 max-w-lg text-center shadow-xl">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>
        
        <h2 className="text-2xl font-bold mb-3 text-foreground">
          {content.title}
        </h2>
        
        <p className="text-muted-foreground mb-4 leading-relaxed">
          {content.description}
        </p>
        
        <p className="text-sm text-muted-foreground mb-6 font-medium">
          Diese Funktion ist Teil von <span className="text-amber-600 dark:text-amber-400">Premium</span>.
        </p>

        <Button
          onClick={handleUpgrade}
          disabled={isLoading || !premiumLink}
          className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg"
          size="lg"
        >
          <Sparkles className="w-5 h-5" />
          Premium freischalten
          <ExternalLink className="w-4 h-4 ml-1" />
        </Button>
        
        {!premiumLink && !isLoading && (
          <p className="text-xs text-muted-foreground mt-4">
            Upgrade-Link nicht verfügbar. Bitte kontaktiere den Support.
          </p>
        )}
      </div>
    </div>
  );
}
