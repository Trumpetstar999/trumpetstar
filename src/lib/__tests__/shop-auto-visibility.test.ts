import { describe, expect, it } from 'vitest';
import { initialShopVisibility } from '../../../supabase/functions/shop-products/visibility';

describe('automatic shop publication', () => {
  it('publishes new active products without manual approval', () => {
    expect(initialShopVisibility('Y')).toBe(true);
    expect(initialShopVisibility(true)).toBe(true);
    expect(initialShopVisibility(undefined)).toBe(true);
  });
  it('does not publish explicitly inactive products', () => {
    for (const value of ['N', 'false', '0', false, 0]) {
      expect(initialShopVisibility(value)).toBe(false);
    }
  });
});