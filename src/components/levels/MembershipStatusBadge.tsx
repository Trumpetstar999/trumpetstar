import { RefreshCw, Crown, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMembership } from '@/hooks/useMembership';
import { PlanKey, PLAN_DISPLAY_NAMES } from '@/types/plans';
import { cn } from '@/lib/utils';

const planColors: Record<PlanKey, string> = {
  FREE: 'bg-muted text-muted-foreground',
  BASIC: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  PREMIUM: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400',
};

export function MembershipStatusBadge() {
  const { planKey, isLoading, refreshMembership, lastSync } = useMembership();

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await refreshMembership();
  };

  const isPremium = planKey === 'PREMIUM';
  const isBasic = planKey === 'BASIC';

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
        planColors[planKey]
      )}>
        {isPremium && <Crown className="w-4 h-4" />}
        {isBasic && <Sparkles className="w-4 h-4" />}
        <span>{PLAN_DISPLAY_NAMES[planKey]}</span>
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
