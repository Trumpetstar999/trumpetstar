import { describe, expect, it } from 'vitest';
import { deliverWelcome, type WelcomeRow, type WelcomeStore } from '../../supabase/functions/brevo-sync-contact/welcome-delivery';
import { voucherFields, voucherExpiry, welcomeLanguage, WELCOME_LANGUAGES, TEST_EMAIL, voucherCheckout } from '../../supabase/functions/brevo-sync-contact/welcome-content';

const input = { userId: 'user', email: 'user@example.com', lang: 'sl' as const, firstName: 'Mario', test: false };
function harness() {
  let row: WelcomeRow | undefined;
  let vouchers = 0, mails = 0;
  const store: WelcomeStore = {
    async reserve(i) { row ??= { id: '1', user_id: i.userId, email: i.email, language: i.lang, first_name: i.firstName,
      created_at: new Date().toISOString(), expires_at: voucherExpiry(new Date().toISOString()), voucher_code: 'WELCOME15-0123456789ABCDEF', status: 'pending', brevo_message_id: null }; return { ...row }; },
    async claim(r, allowed, next) { if (!row || !allowed.includes(row.status)) return false; row.status = next; return true; },
    async update(id, values) { if (row) Object.assign(row, values); },
  };
  const api = { async voucher() { vouchers++; return { ok: true, status: 200 }; }, async mail() { mails++; return { ok: true, status: 201, messageId: 'message-1' }; } };
  return { store, api, counts: () => ({ vouchers, mails }), row: () => row };
}
describe('welcome voucher business rules', () => {
  const fields = voucherFields('WELCOME15-12345678', '2026-10-30T12:00:00.000Z', '2026-11-02T12:00:00.000Z');
  it('restricts products exactly to Basic 346007 and Pro 575565', () => expect(fields.get('data[product_ids]')).toBe('346007,575565'));
  it('discounts the first payment by exactly 15 percent', () => expect(fields.get('data[first_rate]')).toBe('15'));
  it('does not discount subsequent payments', () => expect(fields.get('data[other_rates]')).toBe('0'));
  it('does not discount upgrades', () => expect(fields.get('data[upgrade_policy]')).toBe('not_valid'));
  it('allows exactly one redemption', () => { expect(fields.get('data[is_count_limited]')).toBe('Y'); expect(fields.get('data[count_left]')).toBe('1'); });
  it('expires exactly three days after creation', () => expect(voucherExpiry('2026-10-30T12:00:00.000Z')).toBe('2026-11-02T12:00:00.000Z'));
  it('supports exactly the existing four onboarding languages with German fallback', () => { expect(WELCOME_LANGUAGES).toEqual(['de', 'en', 'es', 'sl']); for (const lang of WELCOME_LANGUAGES) expect(welcomeLanguage(lang)).toBe(lang); expect(welcomeLanguage('fr')).toBe('de'); expect(welcomeLanguage(undefined)).toBe('de'); });
  it('uses documented voucher checkout parameter', () => expect(voucherCheckout('346007', 'WELCOME15-12345678')).toBe('https://www.digistore24.com/product/346007?voucher=WELCOME15-12345678'));
  it('fixes the test recipient', () => expect(TEST_EMAIL).toBe('schulterm@me.com'));
});
describe('welcome delivery idempotency', () => {
  it('sends only once when called twice', async () => { const h = harness(); await deliverWelcome(h.store, input, h.api); await deliverWelcome(h.store, input, h.api); expect(h.counts()).toEqual({ vouchers: 1, mails: 1 }); expect(h.row()?.status).toBe('sent'); });
  it('atomically claims concurrent requests', async () => { const h = harness(); await Promise.all(Array.from({ length: 10 }, () => deliverWelcome(h.store, input, h.api))); expect(h.counts()).toEqual({ vouchers: 1, mails: 1 }); });
  it('reuses the original voucher and language after a rejected mail', async () => { const h = harness(); let code = ''; await deliverWelcome(h.store, input, { ...h.api, async mail() { return { ok: false, status: 400 }; } }); const original = h.row()?.voucher_code; await deliverWelcome(h.store, { ...input, lang: 'en' }, { ...h.api, async mail(row) { code = row.voucher_code; expect(row.language).toBe('sl'); return h.api.mail(); } }); expect(code).toBe(original); expect(h.counts().vouchers).toBe(1); expect(h.row()?.status).toBe('sent'); });
  it('never blindly resends after ambiguous mail outcome', async () => { const h = harness(); await deliverWelcome(h.store, input, { ...h.api, async mail() { throw new Error('network lost'); } }); await deliverWelcome(h.store, input, h.api); expect(h.row()?.status).toBe('mail_uncertain'); expect(h.counts()).toEqual({ vouchers: 1, mails: 0 }); });
  it('never creates another voucher after an ambiguous voucher outcome', async () => { const h = harness(); await deliverWelcome(h.store, input, { ...h.api, async voucher() { throw new Error('timeout'); } }); await deliverWelcome(h.store, input, h.api); expect(h.row()?.status).toBe('voucher_uncertain'); expect(h.counts()).toEqual({ vouchers: 0, mails: 0 }); });
  it('does not mail expired vouchers or extend their deadline', async () => { const h = harness(); await h.store.reserve(input); await h.store.update('1', { expires_at: '2020-01-01T00:00:00Z' }); await deliverWelcome(h.store, input, h.api); expect(h.row()?.status).toBe('expired'); expect(h.counts()).toEqual({ vouchers: 0, mails: 0 }); });
});