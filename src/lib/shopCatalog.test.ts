import { describe, expect, it } from 'vitest';
import { filterShopProducts, shopCategory } from './shopCatalog';
import type { ShopProduct } from './shop';

const p = (id: string, name: string, price: number | null) =>
  ({ id, name, price, currency: 'EUR', created_at: '', image_url: null, order_url: '', is_new: false, sort_override: null, visible: true }) as ShopProduct;

const list = [p('345999', 'Trumpetstar - Band 1', 35), p('346007', 'Trumpetstar Basic', null), p('359456', 'X-Mas Special', null), p('546953', 'Einfache Duette', 29)];
const priceOf = (x: ShopProduct) => x.price;

describe('shop catalog', () => {
  it('puts BASIC and PRO in memberships', () => {
    expect(shopCategory({ id: '346007', name: 'x' })).toBe('membership');
    expect(shopCategory({ id: '575565', name: 'x' })).toBe('membership');
  });
  it('filters by category and search', () => {
    expect(filterShopProducts(list, { query: '', category: 'christmas', sort: 'recommended', priceOf }).map((x) => x.id)).toEqual(['359456']);
    expect(filterShopProducts(list, { query: 'duet', category: 'all', sort: 'recommended', priceOf }).map((x) => x.id)).toEqual(['546953']);
  });
  it('sorts by price with unknown prices last', () => {
    expect(filterShopProducts(list, { query: '', category: 'all', sort: 'priceAsc', priceOf }).map((x) => x.id).slice(0, 2)).toEqual(['546953', '345999']);
    expect(filterShopProducts(list, { query: '', category: 'all', sort: 'priceDesc', priceOf })[0].id).toBe('345999');
  });
});
