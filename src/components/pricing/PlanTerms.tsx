import { useLanguage } from '@/hooks/useLanguage';
import { PLAN_INFO, type PlanKey } from '@/types/plans';
import type { BillingPeriod } from '@/lib/checkout';

export function PlanTerms({ planKey, period }: { planKey: PlanKey; period: BillingPeriod }) {
  const { t } = useLanguage();
  if (planKey === 'FREE') return null;
  const plan = PLAN_INFO[planKey];
  const key = period === 'yearly' ? 'annualTerms' : planKey === 'PRO' ? 'proMonthlyTerms' : 'monthlyTerms';
  return <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`pricing_table.${key}`, {
    price: plan.monthlyPrice ?? 0, intro: plan.introductoryPrice ?? 0, months: plan.minimumTermMonths ?? 6,
  })}</p>;
}