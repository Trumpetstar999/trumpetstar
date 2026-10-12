import { Crown, Sparkles, Rocket } from 'lucide-react';
import { useMembership } from '@/hooks/useMembership';
import { PlanKey, PLAN_DISPLAY_NAMES } from '@/types/plans';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';

// Styled for the blue glass header (badges use bg-white/10 style per header design)
const planStyles: Record<PlanKey, string> = {
  FREE: 'bg-white/10 text-white/90 border-white/25',
  BASIC: 'bg-sky-300/20 text-white border-sky-200/50',
  PRO: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-300',
};

export function MembershipStatusBadge() {
  const { planKey: rawPlanKey } = useMembership();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Handle legacy PREMIUM -> PRO mapping
  const planKey: PlanKey = (rawPlanKey === 'PREMIUM' as any) ? 'PRO' : rawPlanKey;

  const isPro = planKey === 'PRO';
  const isBasic = planKey === 'BASIC';
  const styles = planStyles[planKey] || planStyles.FREE;
  const upgradeLabel = t(`header_upgrade.${isBasic ? 'basic' : 'free'}`);
  const UpgradeIcon = isBasic ? Crown : Rocket;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'h-7 items-center gap-1.5 px-3 rounded-full text-xs font-semibold border backdrop-blur-sm',
          isPro ? 'flex' : 'hidden sm:flex',
          styles
        )}
      >
        {isPro && <Crown className="w-3.5 h-3.5" />}
        {isBasic && <Sparkles className="w-3.5 h-3.5" />}
        <span>{PLAN_DISPLAY_NAMES[planKey]}</span>
      </div>
      {!isPro && (
        <button
          type="button"
          data-no-min-size
          aria-label={upgradeLabel}
          onClick={() => navigate('/pricing')}
          className={cn(
            'group relative h-7 flex items-center gap-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap overflow-hidden',
            'bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 text-slate-900',
            'shadow-[0_0_14px_rgba(251,191,36,0.55)] ring-1 ring-amber-200/70',
            'transition-all duration-200 hover:scale-105 hover:shadow-[0_0_20px_rgba(251,191,36,0.8)] active:scale-95'
          )}
        >
          <UpgradeIcon className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
          <span className="hidden sm:inline">{upgradeLabel.replace(/\s*\p{Extended_Pictographic}+\s*$/u, '')}</span>
          <span className="sm:hidden">{isBasic ? 'PRO' : 'Upgrade'}</span>
        </button>
      )}
    </div>
  );
}
