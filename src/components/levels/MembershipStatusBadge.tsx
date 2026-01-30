import { Crown, Sparkles } from 'lucide-react';
import { useMembership } from '@/hooks/useMembership';
import { PlanKey, PLAN_DISPLAY_NAMES } from '@/types/plans';
import { cn } from '@/lib/utils';

const planStyles: Record<PlanKey, { bg: string; text: string; border: string }> = {
  FREE: { 
    bg: 'bg-muted', 
    text: 'text-muted-foreground', 
    border: 'border-border' 
  },
  BASIC: { 
    bg: 'bg-primary/10', 
    text: 'text-primary', 
    border: 'border-primary/30' 
  },
  PRO: { 
    bg: 'bg-gradient-to-r from-amber-100 to-orange-100', 
    text: 'text-amber-700', 
    border: 'border-amber-300' 
  },
};

export function MembershipStatusBadge() {
  const { planKey: rawPlanKey } = useMembership();

  // Handle legacy PREMIUM -> PRO mapping
  const planKey: PlanKey = (rawPlanKey === 'PREMIUM' as any) ? 'PRO' : rawPlanKey;

  const isPro = planKey === 'PRO';
  const isBasic = planKey === 'BASIC';
  const styles = planStyles[planKey] || planStyles.FREE;

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
      styles.bg,
      styles.text,
      styles.border
    )}>
      {isPro && <Crown className="w-3.5 h-3.5" />}
      {isBasic && <Sparkles className="w-3.5 h-3.5" />}
      <span>{PLAN_DISPLAY_NAMES[planKey]}</span>
    </div>
  );
}
