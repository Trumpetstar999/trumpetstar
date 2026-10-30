import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { escapeHtml } from '../../supabase/functions/_shared/escape-html';
import { verifyIpnSignature, parseIpnForm, isManualMembership, stripIpnCredentials } from '../../supabase/functions/_shared/digistore-security';
import { EVENT_TYPE_MAP, entitlementTransition } from '../../supabase/functions/_shared/digistore-events';

const secret = 'test-only-not-a-live-secret';
function sign(raw: Record<string, string>) {
  const canonical = Object.keys(raw).sort().filter(k => k !== 'sha_sign' && raw[k] !== '').map(k => `${k}=${raw[k]}${secret}`).join('');
  return { ...raw, sha_sign: createHash('sha512').update(canonical).digest('hex').toUpperCase() };
}
describe('payment authentication', () => {
  it('escapes purchase names in welcome mail', () => {
    expect(escapeHtml('<a href="evil">&')).toBe('&lt;a href=&quot;evil&quot;&gt;&amp;');
  });
  const purchase = { event: 'on_payment', product_id: '346007', email: 'test@example.com', order_id: 'TEST-1', amount: '0', first_name: 'Übung' };
  it('requires configured secret even for a signed request', async () => {
    expect(await verifyIpnSignature(sign(purchase), null)).toBe(false);
  });
  it('rejects plaintext secret aliases', async () => {
    expect(await verifyIpnSignature({ ...purchase, secret, sha_sign: secret }, secret)).toBe(false);
  });
  it('accepts official case-sensitive SHA512 signing with Unicode and zero', async () => {
    expect(await verifyIpnSignature(sign(purchase), secret)).toBe(true);
  });
  it.each(['email', 'product_id', 'event'])('rejects modified %s', async (field) => {
    expect(await verifyIpnSignature({ ...sign(purchase), [field]: 'modified' }, secret)).toBe(false);
  });
  it('rejects duplicate form parameters', () => {
    expect(() => parseIpnForm('email=a&email=b')).toThrow('Duplicate');
  });
  it('removes credentials before event storage', () => {
    expect(stripIpnCredentials({ ...sign(purchase), secret })).toEqual(purchase);
  });
  it('preserves a manually assigned plan', () => {
    expect(isManualMembership({ plan_key: 'PRO', active_product_ids: [] })).toBe(true);
    expect(isManualMembership({ plan_key: 'PRO', active_product_ids: ['575565'] })).toBe(false);
  });
});

describe('Digistore24 entitlement events', () => {
  it.each([
    ['on_payment', true, 'active'],
    ['on_rebill_resumed', true, 'active'],
    ['on_refund', false, 'refunded'],
    ['on_chargeback', false, 'chargeback'],
    ['on_rebill_cancelled', false, 'cancelled'],
    ['on_payment_missed', false, 'expired'],
  ])('%s applies the required entitlement state', (event, active, status) => {
    expect(entitlementTransition(EVENT_TYPE_MAP[event], null)).toEqual({ active, status, valid_until: null, cancel_at_period_end: false });
  });
  it('connection tests and unknown events cannot change entitlements', () => {
    expect(entitlementTransition(EVENT_TYPE_MAP.connection_test ?? 'UNKNOWN', null)).toBeNull();
    expect(entitlementTransition('UNKNOWN', null)).toBeNull();
  });
  it('cancellation cannot grant indefinite access without a period end', () => {
    expect(entitlementTransition('CANCELLATION', null)?.active).toBe(false);
  });
});