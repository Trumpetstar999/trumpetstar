import { describe, expect, it } from 'vitest';
import { couponState, inReminderWindow, remindOne, type ReminderApi, type ReminderRow, type ReminderStore } from '../../supabase/functions/brevo-sync-contact/reminder-workflow';
import { reminderEmail } from '../../supabase/functions/brevo-sync-contact/reminder-content';
import { WELCOME_LANGUAGES } from '../../supabase/functions/brevo-sync-contact/welcome-content';

const H = 3600000;
const NOW = Date.parse('2026-11-01T13:00:00Z');
function harness(expiresInHours = 24, active = true, mailOk = true) {
  const row: ReminderRow & { reminder_error?: string } = { id: '1', email: 'u@example.com', language: 'de', first_name: 'Mario', voucher_code: 'WELCOME25-0123456789ABCDEF',
    expires_at: new Date(NOW + expiresInHours * H).toISOString(), status: 'sent', is_test: false, reminder_status: 'pending', reminder_attempts: 0 };
  let owner: string | null = null, mails = 0, lookups = 0;
  const store: ReminderStore = {
    async claim(r, allowed, next, id) { if (!allowed.includes(row.reminder_status)) return false; row.reminder_status = next; owner = id; row.reminder_attempts++; return true; },
    async update(r, id, values) { if (owner !== id) return false; Object.assign(row, values); return true; },
  };
  const api: ReminderApi = {
    async voucherState() { lookups++; return active ? { active: true, reason: 'active' } : { active: false, reason: 'redeemed' }; },
    async mail() { mails++; return mailOk ? { ok: true, status: 201, messageId: 'm1' } : { ok: false, status: 400 }; },
  };
  return { row, store, api, counts: () => ({ mails, lookups }) };
}
const run = (h: ReturnType<typeof harness>, id = 'a') => remindOne(h.store, h.api, { ...h.row }, { test: false, claimId: id, now: NOW });

describe('welcome voucher follow-up', () => {
  it('sends only between 23 and 25 hours before expiry', () => {
    expect(inReminderWindow(new Date(NOW + 22.9 * H).toISOString(), NOW)).toBe(false);
    expect(inReminderWindow(new Date(NOW + 23 * H).toISOString(), NOW)).toBe(true);
    expect(inReminderWindow(new Date(NOW + 25 * H).toISOString(), NOW)).toBe(true);
    expect(inReminderWindow(new Date(NOW + 25.1 * H).toISOString(), NOW)).toBe(false);
  });
  it('does not send outside the window', async () => { const h = harness(30); expect((await run(h)).status).toBe('outside_window'); expect(h.counts().mails).toBe(0); });
  it('sends exactly one follow-up across repeated runs', async () => {
    const h = harness(); expect((await run(h)).status).toBe('sent');
    expect(await run(h, 'b')).toEqual({ status: 'sent', alreadySent: true }); expect(h.counts().mails).toBe(1);
  });
  it('lets only one of two parallel runs send', async () => {
    const h = harness(); await Promise.all([run(h, 'a'), run(h, 'b')]); expect(h.counts().mails).toBe(1);
  });
  it('permanently skips a redeemed voucher with a reason', async () => {
    const h = harness(24, false); expect((await run(h)).status).toBe('skipped');
    expect(h.row.reminder_error).toBe('Skipped: redeemed'); await run(h, 'b'); expect(h.counts().mails).toBe(0);
  });
  it('retries a rejected send with the same voucher', async () => {
    const h = harness(24, true, false); expect((await run(h)).status).toBe('failed'); expect(h.row.voucher_code).toBe('WELCOME25-0123456789ABCDEF');
  });
  it('never resends an uncertain send', async () => { const h = harness(); h.row.reminder_status = 'uncertain'; await run(h); expect(h.counts().mails).toBe(0); });
  it('ignores rows whose welcome mail was not sent', async () => { const h = harness(); h.row.status = 'mail_failed'; expect((await run(h)).status).toBe('not_eligible'); });
  it('requires active voucher with count_left above zero', () => {
    const exp = new Date(NOW + 24 * H).toISOString(), code = 'WELCOME25-X';
    expect(couponState({ code, is_active: 'Y', count_left: '1' }, code, exp, NOW).active).toBe(true);
    expect(couponState({ code, is_active: 'Y', count_left: '0' }, code, exp, NOW).reason).toBe('redeemed');
    expect(couponState({ code, is_active: 'N', count_left: '1' }, code, exp, NOW).reason).toBe('inactive');
    expect(couponState({ code, is_active: 'Y', count_left: '1' }, code, new Date(NOW - 1).toISOString(), NOW).reason).toBe('expired');
    expect(couponState(null, code, exp, NOW).active).toBe(false);
  });
  it('localizes 24 hours, 25 percent first payment and both checkout links', () => {
    for (const lang of WELCOME_LANGUAGES) {
      const m = reminderEmail(lang, null, 'WELCOME25-ABC', '2026-11-02T13:42:32Z');
      expect(m.subject).toMatch(/24/); expect(m.textContent).toMatch(/25/);
      expect(m.htmlContent).toContain('product/346007?voucher=WELCOME25-ABC'); expect(m.htmlContent).toContain('product/575565?voucher=WELCOME25-ABC');
      expect(m.htmlContent.toLowerCase()).not.toContain('unsubscribe');
    }
  });
  it('labels the test mail as follow-up test', () => expect(reminderEmail('de', null, 'C', '2026-11-02T13:42:32Z', true).subject).toMatch(/^\[TEST · Follow-up/));
});
