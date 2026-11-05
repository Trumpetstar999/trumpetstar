import type { ShopProduct } from './shop';

export type ShopCategory = 'all' | 'membership' | 'courses' | 'books' | 'christmas';
export type ShopSort = 'recommended' | 'priceAsc' | 'priceDesc' | 'name';

const MEMBERSHIP_IDS = new Set(['346007', '575565', '346002', '355971', '345378']);

export function shopCategory(p: Pick<ShopProduct, 'id' | 'name'>): Exclude<ShopCategory, 'all'> {
  const n = p.name.toLowerCase();
  if (MEMBERSHIP_IDS.has(p.id) || /onlinezugang|testzugang/.test(n)) return 'membership';
  if (/x-?mas/.test(n)) return 'christmas';
  if (/kurs|übetrick|leben/.test(n)) return 'courses';
  return 'books';
}

export function filterShopProducts<T extends ShopProduct>(
  list: T[], opts: { query: string; category: ShopCategory; sort: ShopSort; priceOf: (p: T) => number | null },
): T[] {
  const q = opts.query.trim().toLowerCase();
  const out = list.filter((p) =>
    (opts.category === 'all' || shopCategory(p) === opts.category) && (!q || p.name.toLowerCase().includes(q)));
  if (opts.sort === 'name') return [...out].sort((a, b) => a.name.localeCompare(b.name));
  if (opts.sort === 'priceAsc' || opts.sort === 'priceDesc') {
    const dir = opts.sort === 'priceAsc' ? 1 : -1;
    return [...out].sort((a, b) => {
      const pa = opts.priceOf(a), pb = opts.priceOf(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return (pa - pb) * dir;
    });
  }
  return out;
}
