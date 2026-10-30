import type { PlanKey } from '@/types/plans';

export type BillingPeriod = 'monthly' | 'yearly';
export const GUARANTEE_DAYS = 30;
export type CheckoutConfig = { productId: string; planId: string } | null;
const VERIFIED_CHECKOUTS: Record<'BASIC' | 'PRO', Record<BillingPeriod, CheckoutConfig>> = {
  BASIC: { monthly: { productId: '346007', planId: '1546159' }, yearly: { productId: '346007', planId: '739857' } },
  PRO: { monthly: { productId: '575565', planId: '1194668' }, yearly: { productId: '575565', planId: '1172812' } },
};

export function validateCheckoutUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const match = url.pathname.match(/^\/product\/(\d+)\/?$/);
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !['www.checkout-ds24.com', 'www.digistore24.com'].includes(url.hostname) ||
      !match || url.hash || url.searchParams.size !== 1 ||
      !/^\d+$/.test(url.searchParams.get('plan') ?? '')) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function checkoutUrlFromConfig(config: CheckoutConfig | undefined): string | null {
  if (!config || !/^\d+$/.test(config.productId) || !/^\d+$/.test(config.planId)) return null;
  return validateCheckoutUrl(`https://www.checkout-ds24.com/product/${config.productId}/?plan=${config.planId}`);
}

export function getCheckoutUrl(plan: PlanKey, period: BillingPeriod = 'monthly'): string | null {
  return plan === 'FREE' ? null : checkoutUrlFromConfig(VERIFIED_CHECKOUTS[plan]?.[period]);
}