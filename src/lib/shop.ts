export interface ShopProduct {
  id: string;
  name: string;
  price: number | null;
  currency: string;
  created_at: string;
  image_url: string | null;
  order_url: string;
  is_new: boolean;
  sort_override: number | null;
  visible: boolean;
}

export const NEW_PRODUCT_DAYS = 60;

/** "NEU" when manually flagged or created within the last 60 days. */
export function isNewProduct(p: Pick<ShopProduct, 'is_new' | 'created_at'>, now = Date.now()): boolean {
  if (p.is_new) return true;
  const created = Date.parse(p.created_at);
  return Number.isFinite(created) && now - created < NEW_PRODUCT_DAYS * 86_400_000;
}

/** Manual order first (ascending), then newest first. */
export function sortShopProducts<T extends Pick<ShopProduct, 'sort_override' | 'created_at'>>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ao = a.sort_override, bo = b.sort_override;
    if (ao != null && bo != null && ao !== bo) return ao - bo;
    if (ao != null && bo == null) return -1;
    if (ao == null && bo != null) return 1;
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}

/** Only Digistore24 product order pages are allowed as shop purchase links. */
export function isSafeShopOrderUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && ['www.digistore24.com', 'www.checkout-ds24.com'].includes(u.hostname)
      && /^\/product\/\d+\/?$/.test(u.pathname);
  } catch {
    return false;
  }
}

export function formatPrice(price: number | null, currency: string, locale: string): string {
  if (price == null) return '';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'EUR' }).format(price);
}
