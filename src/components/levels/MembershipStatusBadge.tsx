import { Crown, Sparkles } from 'lucide-react';
import { useMembership } from '@/hooks/useMembership';
import { PlanKey, PLAN_DISPLAY_NAMES } from '@/types/plans';
import { cn } from '@/lib/utils';

const planStyles: Record<PlanKey, { bg: string; text: string; border: string }> = {
  FREE: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-700', 
    border: 'border-gray-300' 
  },
  BASIC: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-700', 
    border: 'border-blue-300' 
  },
  PREMIUM: { 
    bg: 'bg-gradient-to-r from-amber-100 to-orange-100', 
    text: 'text-amber-700', 
    border: 'border-amber-300' 
  },
};

export function MembershipStatusBadge() {
  const { planKey } = useMembership();

  const isPremium = planKey === 'PREMIUM';
  const isBasic = planKey === 'BASIC';
  const styles = planStyles[planKey];

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
      styles.bg,
      styles.text,
      styles.border
    )}>
      {isPremium && <Crown className="w-3.5 h-3.5" />}
      {isBasic && <Sparkles className="w-3.5 h-3.5" />}
      <span>{PLAN_DISPLAY_NAMES[planKey]}</span>
    </div>
  );
}
