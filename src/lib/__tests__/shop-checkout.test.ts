import { describe, expect, it } from 'vitest';
import { isSafeShopOrderUrl, shopCheckoutUrl } from '../shop';
import { PLAN_INFO } from '@/types/plans';

describe('shop purchase destinations', () => {
  it('selects the existing BASIC monthly payment plan', () => {
    expect(shopCheckoutUrl({ id: '346007', order_url: 'https://www.digistore24.com/product/346007' })).toBe('https://www.checkout-ds24.com/product/346007/?plan=1546159');
    expect(PLAN_INFO.BASIC.monthlyPrice).toBe(15);
  });
  it('selects the verified PRO monthly plan for its introductory offer', () => {
    expect(shopCheckoutUrl({ id: '575565', order_url: 'https://www.digistore24.com/product/575565' })).toBe('https://www.checkout-ds24.com/product/575565/?plan=1194668');
    expect(PLAN_INFO.PRO.introductoryPrice).toBe(1);
    expect(PLAN_INFO.PRO.monthlyPrice).toBe(59);
    expect(PLAN_INFO.PRO.minimumTermMonths).toBe(6);
  });
  it('preserves book destinations', () => {
    expect(shopCheckoutUrl({ id: '757146', order_url: 'https://www.digistore24.com/product/757146' })).toBe('https://www.digistore24.com/product/757146');
  });
  it('rejects credentials and ambiguous plan queries', () => {
    expect(isSafeShopOrderUrl('https://evil@www.digistore24.com/product/575565')).toBe(false);
    expect(isSafeShopOrderUrl('https://www.digistore24.com/product/575565?plan=1194668&plan=1172812')).toBe(false);
    expect(isSafeShopOrderUrl('https://www.digistore24.com/product/575565?plan=1194668')).toBe(true);
  });
});