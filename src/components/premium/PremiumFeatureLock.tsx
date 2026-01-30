import { Lock, ExternalLink, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMembership } from '@/hooks/useMembership';

type FeatureType = 'classroom' | 'feedback' | 'teacher';

interface FeatureContent {
  title: string;
  description: string;
  bullets?: string[];
  hint?: string;
}

const FEATURE_CONTENT: Record<FeatureType, FeatureContent> = {
  classroom: {
    title: 'Live-Unterricht & gemeinsames Musizieren',
    description: 'Im Klassenzimmer triffst du deinen Lehrer und andere Musiker live. Ihr könnt gemeinsam spielen, Fragen klären und gezielt an deinem Fortschritt arbeiten. Diese Funktion ist Teil von Premium.',
    bullets: [
      'Live-Sessions wie im echten Unterricht',
      'Gemeinsames Spielen & Zuhören',
      'Geplante Termine oder spontan starten',
      'Persönlicher Austausch in ruhiger Lernatmosphäre',
    ],
    hint: 'Du kannst jederzeit zu Premium wechseln – dein Fortschritt bleibt erhalten.',
  },
  feedback: {
    title: 'Persönliches Feedback zu deinen Aufnahmen',
    description: 'Mit Premium kannst du deine Aufnahmen direkt an deinen Lehrer oder den Admin senden und gezieltes Feedback mit Zeitmarken und Antwort-Videos erhalten.',
  },
  teacher: {
    title: 'Unterrichten & Feedback geben',
    description: 'Der Lehrer-Modus ermöglicht dir, Schüler zu begleiten, Videos zu kommentieren und Unterricht im Klassenzimmer zu geben. Diese Funktion ist Teil von Premium.',
  },
};

interface PremiumFeatureLockProps {
  feature: FeatureType;
  className?: string;
}

export function PremiumFeatureLock({ feature, className = '' }: PremiumFeatureLockProps) {
  const { getUpgradeLink, isLoading } = useMembership();
  const content = FEATURE_CONTENT[feature];
  const proLink = getUpgradeLink('PRO');

  const handleUpgrade = () => {
    if (proLink) {
      window.open(proLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-[60vh] p-6 ${className}`}>
      <div className="card-glass rounded-lg p-8 max-w-lg text-center">
        {/* Lock icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-reward-gold/20 to-reward-gold/10 flex items-center justify-center mx-auto mb-6 glow-gold">
          <Lock className="w-10 h-10 text-reward-gold" />
        </div>
        
        <h2 className="text-2xl font-bold mb-3 text-gray-900">
          {content.title}
        </h2>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          {content.description}
        </p>
        
        {/* Bullet points for classroom */}
        {content.bullets && (
          <ul className="text-left space-y-3 mb-6">
            {content.bullets.map((bullet, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-blue-mid/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-brand-blue-mid" />
                </div>
                <span className="text-gray-700">{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        <Button
          onClick={handleUpgrade}
          disabled={isLoading || !proLink}
          className="w-full gap-2 bg-accent-red hover:bg-accent-red/90 text-white shadow-lg rounded-full text-lg py-6"
          size="lg"
        >
          <Sparkles className="w-5 h-5" />
          Pro freischalten
          <ExternalLink className="w-4 h-4 ml-1" />
        </Button>
        
        {content.hint && (
          <p className="text-xs text-muted-foreground mt-4">
            {content.hint}
          </p>
        )}
        
        {!proLink && !isLoading && (
          <p className="text-xs text-muted-foreground mt-4">
            Upgrade-Link nicht verfügbar. Bitte kontaktiere den Support.
          </p>
        )}
      </div>
    </div>
  );
}
