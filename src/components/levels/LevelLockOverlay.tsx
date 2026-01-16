import { Lock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MembershipPlan } from '@/types';
import { useWordPressMembership } from '@/hooks/useWordPressMembership';

interface LevelLockOverlayProps {
  requiredPlan: MembershipPlan;
  levelTitle: string;
}

const planNames: Record<MembershipPlan, string> = {
  FREE: 'Kostenlos',
  PLAN_A: 'Premium',
  PLAN_B: 'Premium Plus',
};

export function LevelLockOverlay({ requiredPlan, levelTitle }: LevelLockOverlayProps) {
  const { getUpgradeLink, isLinked, startOAuthFlow, isLoading } = useWordPressMembership();

  const upgradeLink = getUpgradeLink(requiredPlan);

  const handleUpgrade = () => {
    if (upgradeLink) {
      window.open(upgradeLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleConnect = async () => {
    await startOAuthFlow();
  };

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md mx-4 text-center shadow-xl">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">
          Level gesperrt
        </h3>
        
        <p className="text-muted-foreground mb-6">
          Um <strong>"{levelTitle}"</strong> freizuschalten, benötigst du den <strong>{planNames[requiredPlan]}</strong> Plan.
        </p>

        {!isLinked ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Verbinde dein Trumpetstar-Konto, um deine Mitgliedschaft zu laden.
            </p>
            <Button 
              onClick={handleConnect} 
              className="w-full gap-2"
              disabled={isLoading}
            >
              <ExternalLink className="w-4 h-4" />
              Mit Trumpetstar verbinden
            </Button>
          </div>
        ) : upgradeLink ? (
          <Button 
            onClick={handleUpgrade} 
            className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
          >
            <ExternalLink className="w-4 h-4" />
            Jetzt upgraden
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Kontaktiere den Support für Upgrade-Optionen.
          </p>
        )}
      </div>
    </div>
  );
}
