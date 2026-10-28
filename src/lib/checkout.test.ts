import { describe, expect, it } from 'vitest';
import { getCheckoutUrl, validateCheckoutUrl, GUARANTEE_DAYS } from './checkout';
import { PLAN_INFO } from '@/types/plans';

describe('checkout safety', () => {
  it.each(['346007', '575565'])('blocks incorrect product %s', (id) => {
    expect(validateCheckoutUrl(`https://www.checkout-ds24.com/product/${id}/`)).toBeNull();
    expect(validateCheckoutUrl(`https://www.digistore24.com/product/${id}?x=1`)).toBeNull();
  });
  it.each(['BASIC', 'PRO'] as const)('pauses both unverified periods for %s', (plan) => {
    expect(getCheckoutUrl(plan, 'monthly')).toBeNull();
    expect(getCheckoutUrl(plan, 'yearly')).toBeNull();
  });
  it('rejects unsafe and non-checkout destinations', () => {
    for (const url of [undefined, '', 'javascript:alert(1)', 'https://example.com/product/123/', 'http://www.checkout-ds24.com/product/123/', 'https://www.checkout-ds24.com@evil.com/product/123/']) {
      expect(validateCheckoutUrl(url)).toBeNull();
    }
  });
  it('uses Basic 15 monthly and 149 annually', () => {
    expect([PLAN_INFO.BASIC.monthlyPrice, PLAN_INFO.BASIC.yearlyPrice]).toEqual([15, 149]);
  });
  it('uses Pro 59 monthly and 600 annually', () => {
    expect([PLAN_INFO.PRO.monthlyPrice, PLAN_INFO.PRO.yearlyPrice]).toEqual([59, 600]);
  });
  it('keeps the guarantee at 30 days', () => expect(GUARANTEE_DAYS).toBe(30));
});