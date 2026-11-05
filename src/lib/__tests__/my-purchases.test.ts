import { describe, expect, it } from 'vitest';
import { belongsToBuyer, safeOrderUrl, summarizePurchases } from '../../../supabase/functions/my-purchases/purchases';

describe('personal Digistore24 purchases', () => {
  it('returns only verified buyer identity when no immutable owner exists', () => {
    expect(belongsToBuyer('buyer@example.com', ' Buyer@Example.com ', 'order', new Map(), 'user')).toBe(true);
    expect(belongsToBuyer('buyer@example.com', 'other@example.com', 'order', new Map(), 'user')).toBe(false);
  });
  it('never overrides immutable ownership with an email match', () => {
    expect(belongsToBuyer('buyer@example.com', 'buyer@example.com', 'order', new Map([['order', 'other']]), 'user')).toBe(false);
  });
  it('groups subscription payments by order and product', () => {
    const list = summarizePurchases([
      { product_id: '346007', status: 'completed', amount: 15, pay_date: '2026-10-01', raw_data: { order_id: 'ORDER' } },
      { product_id: '346007', status: 'completed', amount: 15, pay_date: '2026-11-01', raw_data: { order_id: 'ORDER' } },
    ]);
    expect(list).toHaveLength(1);
    expect(list[0].productId).toBe('346007');
  });
  it('does not offer downloads for refunded purchases even after a later payment row', () => {
    const rows = [
      { product_id: '123', status: 'refunded', raw_data: { order_id: 'ORDER', download_url: 'https://www.digistore24.com/download/123' } },
      { product_id: '123', status: 'completed', pay_date: '2026-11-05', raw_data: { order_id: 'ORDER', download_url: 'https://www.digistore24.com/download/123' } },
    ];
    expect(summarizePurchases(rows)[0].downloadUrl).toBeNull();
    expect(summarizePurchases(rows)[0].status).toBe('refunded');
  });
  it('rejects arbitrary hosts, non-HTTPS links and URL credentials', () => {
    expect(safeOrderUrl('https://www.digistore24.com/receipt/123')).toBe('https://www.digistore24.com/receipt/123');
    for (const url of ['javascript:alert(1)', 'http://digistore24.com/x', 'https://digistore24.com.evil.test/x', 'https://user:password@digistore24.com/x']) expect(safeOrderUrl(url)).toBeNull();
  });
});