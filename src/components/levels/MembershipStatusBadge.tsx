import { RefreshCw, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWordPressMembership, MembershipPlan } from '@/hooks/useWordPressMembership';
import { cn } from '@/lib/utils';

const planNames: Record<MembershipPlan, string> = {
  FREE: 'Kostenlos',
  PLAN_A: 'Premium',
  PLAN_B: 'Premium Plus',
};

const planColors: Record<MembershipPlan, string> = {
  FREE: 'bg-muted text-muted-foreground',
  PLAN_A: 'bg-amber-500/20 text-amber-600',
  PLAN_B: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600',
};

export function MembershipStatusBadge() {
  const { isLinked, plan, isLoading, refreshMembership, lastSync, wpUser } = useWordPressMembership();

  if (!isLinked) {
    return null;
  }

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await refreshMembership();
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
        planColors[plan]
      )}>
        {plan !== 'FREE' && <Crown className="w-4 h-4" />}
        <span>{planNames[plan]}</span>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8"
        onClick={handleRefresh}
        disabled={isLoading}
        title={lastSync ? `Zuletzt aktualisiert: ${lastSync.toLocaleTimeString()}` : 'Mitgliedschaft aktualisieren'}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
