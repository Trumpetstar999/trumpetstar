import type { PlanKey } from '@/types/plans';

export type BillingPeriod = 'monthly' | 'yearly';
export const GUARANTEE_DAYS = 30;
const BLOCKED_PRODUCTS = new Set<string>();

// Only individually verified plan/period URLs may reopen purchases.
const VERIFIED_CHECKOUTS: Record<'BASIC' | 'PRO', Record<BillingPeriod, string | null>> = {
  BASIC: { monthly: 'https://www.digistore24.com/product/346007', yearly: 'https://www.digistore24.com/product/346007' },
  PRO: { monthly: 'https://www.checkout-ds24.com/product/575565/', yearly: 'https://www.checkout-ds24.com/product/575565/' },
};

export function validateCheckoutUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const match = url.pathname.match(/^\/product\/(\d+)\/?$/);
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !['www.checkout-ds24.com', 'www.digistore24.com'].includes(url.hostname) ||
      !match || BLOCKED_PRODUCTS.has(match[1])) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function getCheckoutUrl(plan: PlanKey, period: BillingPeriod = 'monthly'): string | null {
  return plan === 'FREE' ? null : validateCheckoutUrl(VERIFIED_CHECKOUTS[plan][period]);
}