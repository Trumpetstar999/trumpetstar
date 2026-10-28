import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { verifyIpnSignature, parseIpnForm, isManualMembership, stripIpnCredentials } from '../../supabase/functions/_shared/digistore-security';

const secret = 'test-only-not-a-live-secret';
function sign(raw: Record<string, string>) {
  const canonical = Object.keys(raw).sort().filter(k => k !== 'sha_sign' && raw[k] !== '').map(k => `${k}=${raw[k]}${secret}`).join('');
  return { ...raw, sha_sign: createHash('sha512').update(canonical).digest('hex').toUpperCase() };
}
describe('payment authentication', () => {
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