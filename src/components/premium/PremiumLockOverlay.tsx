import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanKey, PLAN_DISPLAY_NAMES, getRequiredUpgradePlans } from '@/types/plans';
import { useMembership } from '@/hooks/useMembership';
import { useNavigate } from 'react-router-dom';

interface PremiumLockOverlayProps {
  requiredPlanKey: PlanKey;
  title?: string;
}

export function PremiumLockOverlay({ requiredPlanKey, title }: PremiumLockOverlayProps) {
  const { planKey } = useMembership();
  const navigate = useNavigate();
  
  const upgradePlans = getRequiredUpgradePlans(planKey, requiredPlanKey);
  
  const handleUpgrade = () => {
    navigate('/pricing');
  };

  return (
    <div className="flex items-center justify-center p-6">
      <div className="card-glass rounded-lg p-8 max-w-md text-center">
        {/* Lock icon with gold glow */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-reward-gold/30 to-reward-gold/10 flex items-center justify-center mx-auto mb-4 glow-gold animate-glow-pulse">
          <Lock className="w-8 h-8 text-reward-gold" />
        </div>
        
        <h3 className="text-xl font-bold mb-2 text-gray-900">
          Level gesperrt
        </h3>
        
        <p className="text-gray-600 mb-6">
          {title ? (
            <>Um <strong className="text-gray-900">"{title}"</strong> freizuschalten, benötigst du den <strong className="text-brand-blue-mid">{PLAN_DISPLAY_NAMES[requiredPlanKey]}</strong> Plan.</>
          ) : (
            <>Diese Inhalte sind ab <strong className="text-brand-blue-mid">{PLAN_DISPLAY_NAMES[requiredPlanKey]}</strong> verfügbar.</>
          )}
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleUpgrade}
            className="w-full gap-2 rounded-full text-base py-5 bg-accent-red hover:bg-accent-red/90 text-white shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            <ArrowRight className="w-4 h-4" />
            {PLAN_DISPLAY_NAMES[requiredPlanKey]} freischalten
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          Du kannst jederzeit upgraden – dein Fortschritt bleibt erhalten.
        </p>
      </div>
    </div>
  );
}
