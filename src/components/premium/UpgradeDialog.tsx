import { ExternalLink, Sparkles, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlanKey, PLAN_DISPLAY_NAMES, getRequiredUpgradePlans } from '@/types/plans';
import { useMembership } from '@/hooks/useMembership';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredPlanKey?: PlanKey;
  title?: string;
  description?: string;
}

const DEFAULT_TITLE = 'Mehr Raum für dein musikalisches Wachstum';
const DEFAULT_DESCRIPTION = 'Premium eröffnet dir Live-Unterricht, persönliches Feedback und intensiven musikalischen Austausch.';

export function UpgradeDialog({ 
  open, 
  onOpenChange, 
  requiredPlanKey = 'PREMIUM',
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: UpgradeDialogProps) {
  const { planKey, getUpgradeLink, isLoading } = useMembership();
  
  const upgradePlans = getRequiredUpgradePlans(planKey, requiredPlanKey);
  
  const handleUpgrade = (targetPlan: PlanKey) => {
    const link = getUpgradeLink(targetPlan);
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {upgradePlans.map((plan) => {
            const link = getUpgradeLink(plan);
            const isPremium = plan === 'PREMIUM';
            
            return (
              <Button
                key={plan}
                onClick={() => handleUpgrade(plan)}
                disabled={isLoading || !link}
                className={`w-full gap-2 ${
                  isPremium 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg' 
                    : ''
                }`}
                variant={isPremium ? 'default' : 'outline'}
                size="lg"
              >
                {isPremium && <Sparkles className="w-5 h-5" />}
                {PLAN_DISPLAY_NAMES[plan]}
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            );
          })}
          
          {upgradePlans.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Du hast bereits Zugang zu diesem Feature.
            </p>
          )}
        </div>
        
        {upgradePlans.some(p => !getUpgradeLink(p)) && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Einige Upgrade-Links sind nicht konfiguriert.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
