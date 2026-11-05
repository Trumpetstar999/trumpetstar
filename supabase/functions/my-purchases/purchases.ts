export type Raw = Record<string, unknown>;
export interface Purchase {
  id: string; orderId: string; productId: string; name: string;
  date: string | null; amount: number | null; currency: string;
  status: 'paid' | 'cancelled' | 'refunded' | 'pending';
  orderUrl: string | null; downloadUrl: string | null;
}
const text = (v: unknown) => typeof v === 'string' || typeof v === 'number' ? String(v) : '';
const normalized = (v: unknown) => text(v).trim().toLowerCase();
export function belongsToBuyer(email: string, purchaseEmail: unknown, orderId: string, owners: Map<string, string>, userId: string) {
  const owner = owners.get(orderId);
  return owner ? owner === userId : !!email && normalized(purchaseEmail) === normalized(email);
}
export function safeOrderUrl(value: unknown): string | null {
  try {
    const url = new URL(text(value));
    return url.protocol === 'https:' && !url.username && !url.password &&
      (url.hostname === 'digistore24.com' || url.hostname.endsWith('.digistore24.com')) ? url.href : null;
  } catch { return null; }
}
export function summarizePurchases(rows: Raw[]): Purchase[] {
  const result = new Map<string, Purchase>();
  const expanded = rows.flatMap(row => {
    const items = row.items;
    const list = Array.isArray(items) ? items : items && typeof items === 'object' ? Object.values(items) : [];
    return list.length ? list.map(item => ({ ...row, ...(item as Raw), id: row.id, amount: null })) : [row];
  });
  for (const row of expanded) {
    const raw = (row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : row) as Raw;
    const orderId = text(raw.order_id || raw.id || row.digistore_transaction_id);
    const productId = text(row.product_id || raw.product_id || raw.main_product_id);
    if (!orderId || !productId) continue;
    const id = `${orderId}:${productId}`;
    const statusText = normalized(row.status || raw.billing_status);
    const refunded = !!row.refund_date || /refund|chargeback/.test(statusText) || /refund|chargeback/.test(normalized(raw.event || raw.transaction_type));
    const status: Purchase['status'] = refunded ? 'refunded' : /cancel|abort/.test(statusText) ? 'cancelled' : /completed|paying|paid|payment|active/.test(statusText) ? 'paid' : 'pending';
    const value = row.amount ?? raw.amount ?? raw.amount_brutto;
    const amount = value == null || value === '' ? null : Number(value);
    const date = text(row.pay_date || raw.order_date_time || raw.created_at || row.created_at) || null;
    const purchase: Purchase = {
      id, orderId, productId, name: text(row.product_name || raw.product_name || raw.main_product_name) || productId,
      date, amount: amount !== null && Number.isFinite(amount) ? amount : null,
      currency: /^[A-Z]{3}$/.test(text(row.currency || raw.currency)) ? text(row.currency || raw.currency) : 'EUR',
      status, orderUrl: safeOrderUrl(raw.order_details_url || raw.receipt_url),
      // Only provider-hosted explicit download URLs, never license/login URLs or course PDFs.
      downloadUrl: status === 'paid' ? safeOrderUrl(raw.download_url) : null,
    };
    const existing = result.get(id);
    if (!existing) result.set(id, purchase);
    else if (purchase.status === 'refunded' || (existing.status !== 'refunded' && (purchase.date || '') > (existing.date || ''))) {
      result.set(id, { ...purchase, orderUrl: purchase.orderUrl || existing.orderUrl });
    }
  }
  return [...result.values()].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}