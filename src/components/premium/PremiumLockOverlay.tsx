import { Lock, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanKey, PLAN_DISPLAY_NAMES, getRequiredUpgradePlans } from '@/types/plans';
import { useMembership } from '@/hooks/useMembership';

interface PremiumLockOverlayProps {
  requiredPlanKey: PlanKey;
  title?: string;
}

export function PremiumLockOverlay({ requiredPlanKey, title }: PremiumLockOverlayProps) {
  const { planKey, getUpgradeLink, isLoading } = useMembership();
  
  const upgradePlans = getRequiredUpgradePlans(planKey, requiredPlanKey);
  
  const handleUpgrade = (targetPlan: PlanKey) => {
    const link = getUpgradeLink(targetPlan);
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md mx-4 text-center shadow-xl">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">
          Level gesperrt
        </h3>
        
        <p className="text-muted-foreground mb-6">
          {title ? (
            <>Um <strong>"{title}"</strong> freizuschalten, benötigst du den <strong>{PLAN_DISPLAY_NAMES[requiredPlanKey]}</strong> Plan.</>
          ) : (
            <>Diese Inhalte sind ab <strong>{PLAN_DISPLAY_NAMES[requiredPlanKey]}</strong> verfügbar.</>
          )}
        </p>

        <div className="space-y-3">
          {upgradePlans.map((plan) => {
            const link = getUpgradeLink(plan);
            return (
              <Button
                key={plan}
                onClick={() => handleUpgrade(plan)}
                disabled={isLoading || !link}
                className={`w-full gap-2 ${
                  plan === 'PREMIUM' 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white' 
                    : ''
                }`}
                variant={plan === 'PREMIUM' ? 'default' : 'outline'}
              >
                {plan === 'PREMIUM' && <Sparkles className="w-4 h-4" />}
                <ExternalLink className="w-4 h-4" />
                {PLAN_DISPLAY_NAMES[plan]} freischalten
              </Button>
            );
          })}
          
          {upgradePlans.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Kontaktiere den Support für Upgrade-Optionen.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
