import { describe, expect, it } from 'vitest';
import { getCheckoutUrl, checkoutUrlFromConfig, validateCheckoutUrl, GUARANTEE_DAYS } from './checkout';
import { PLAN_INFO } from '@/types/plans';

describe('checkout safety', () => {
  it('uses the owner-supplied Basic product 346007', () => {
    expect(getCheckoutUrl('BASIC', 'monthly')).toBe('https://www.checkout-ds24.com/product/346007/?plan=1546159');
    expect(getCheckoutUrl('BASIC', 'yearly')).toBe('https://www.checkout-ds24.com/product/346007/?plan=739857');
  });
  it('uses the owner-supplied Pro product 575565', () => {
    expect(getCheckoutUrl('PRO', 'monthly')).toBe('https://www.checkout-ds24.com/product/575565/?plan=1194668');
    expect(getCheckoutUrl('PRO', 'yearly')).toBe('https://www.checkout-ds24.com/product/575565/?plan=1172812');
  });
  it('rejects unsafe and non-checkout destinations', () => {
    for (const url of [undefined, '', 'javascript:alert(1)', 'https://example.com/product/123/', 'http://www.checkout-ds24.com/product/123/', 'https://www.checkout-ds24.com@evil.com/product/123/']) {
      expect(validateCheckoutUrl(url)).toBeNull();
    }
  });
  it('uses Basic 15 monthly and 149 annually', () => {
    expect([PLAN_INFO.BASIC.monthlyPrice, PLAN_INFO.BASIC.yearlyPrice]).toEqual([15, 149]);
  });
  it('uses Pro 59 monthly and 500 annually', () => {
    expect([PLAN_INFO.PRO.monthlyPrice, PLAN_INFO.PRO.yearlyPrice]).toEqual([59, 500]);
  });
  it('fails closed without a payment plan', () => {
    expect(checkoutUrlFromConfig({ productId: '346007', planId: '' })).toBeNull();
    expect(checkoutUrlFromConfig(null)).toBeNull();
    expect(getCheckoutUrl('FREE')).toBeNull();
  });
  it('rejects extra or duplicate query parameters and fragments', () => {
    for (const suffix of ['?plan=1546159&other=1', '?plan=1546159&plan=739857', '?plan=abc', '?plan=1546159#other']) {
      expect(validateCheckoutUrl(`https://www.checkout-ds24.com/product/346007/${suffix}`)).toBeNull();
    }
  });
  it('derives annual discounts from the actual prices', () => {
    expect(PLAN_INFO.BASIC.yearlyDiscount).toBe(17);
    expect(PLAN_INFO.PRO.yearlyDiscount).toBe(29);
  });
  it('uses a six-month minimum term for both monthly paid plans', () => {
    expect(PLAN_INFO.BASIC.minimumTermMonths).toBe(6);
    expect(PLAN_INFO.PRO.minimumTermMonths).toBe(6);
  });
  it('starts Pro monthly at one euro', () => {
    expect(PLAN_INFO.PRO.introductoryPrice).toBe(1);
  });
  it('keeps the guarantee at 30 days', () => expect(GUARANTEE_DAYS).toBe(30));
});