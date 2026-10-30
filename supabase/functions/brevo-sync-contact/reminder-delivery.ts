import { adminClient } from '../_shared/brevo-auth.ts';
import { brevoFetch } from '../_shared/brevo.ts';
import { reminderEmail } from './reminder-content.ts';
import { couponState, remindOne, REMINDER_MAX_HOURS, REMINDER_MIN_HOURS, REMINDER_STALE_MINUTES, type ReminderApi, type ReminderRow, type ReminderStore } from './reminder-workflow.ts';
import { TEST_USER_ID } from './welcome-content.ts';

type DB = ReturnType<typeof adminClient>;
const COLUMNS = 'id,email,language,first_name,voucher_code,expires_at,status,is_test,reminder_status,reminder_attempts';

export function reminderStore(db: DB): ReminderStore {
  return {
    async claim(row, allowed, next, claimId) {
      const now = new Date();
      const values = { reminder_status: next, reminder_claim_id: claimId, reminder_claimed_at: now.toISOString(), reminder_attempts: row.reminder_attempts + 1, updated_at: now.toISOString() };
      const { data, error } = await db.from('app_welcome_vouchers').update(values).eq('id', row.id).eq('status', 'sent').in('reminder_status', allowed).select('id');
      if (error) throw new Error('Reminder claim failed');
      if (data?.length) return true;
      // A worker that died before contacting Brevo leaves `checking`; reclaiming it cannot duplicate a mail.
      const stale = new Date(now.getTime() - REMINDER_STALE_MINUTES * 60000).toISOString();
      const { data: again, error: staleError } = await db.from('app_welcome_vouchers').update(values).eq('id', row.id).eq('status', 'sent')
        .eq('reminder_status', 'checking').lt('reminder_claimed_at', stale).select('id');
      if (staleError) throw new Error('Reminder claim failed');
      return !!again?.length;
    },
    async update(row, claimId, values) {
      const { data, error } = await db.from('app_welcome_vouchers').update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', row.id).eq('reminder_claim_id', claimId).select('id');
      if (error) throw new Error('Reminder persistence failed; reconciliation required');
      return !!data?.length;
    },
  };
}

export const reminderApi: ReminderApi = {
  async voucherState(row) {
    const key = Deno.env.get('DIGISTORE24_API_KEY');
    if (!key) throw new Error('DIGISTORE24_API_KEY is not configured');
    const url = new URL('https://www.digistore24.com/api/call/getVoucher');
    url.searchParams.set('code', row.voucher_code);
    const response = await fetch(url, { headers: { 'X-DS-API-KEY': key, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body) throw new Error('lookup failed');
    if (body.result === 'error') return { active: false, reason: 'voucher_not_found' };
    return couponState(body.coupon ?? body.data?.coupon, row.voucher_code, row.expires_at);
  },
  async mail(row, test) {
    const result = await brevoFetch('/smtp/email', { method: 'POST', logErrors: false, body: {
      sender: { name: 'Trumpetstar GmbH', email: 'info@trumpetstar.com' },
      to: [{ email: row.email, ...(row.first_name ? { name: row.first_name } : {}) }],
      ...reminderEmail(row.language, row.first_name, row.voucher_code, row.expires_at, test),
      tags: [test ? 'app-welcome-voucher-reminder-test' : 'app-welcome-voucher-reminder'],
    } });
    const data = result.data as { messageId?: string } | null;
    return { ok: result.ok && !!data?.messageId, messageId: data?.messageId, status: result.status,
      uncertain: result.status >= 500 || (result.ok && !data?.messageId) };
  },
};

export async function runReminders(db: DB) {
  const now = Date.now();
  const { data, error } = await db.from('app_welcome_vouchers').select(COLUMNS)
    .eq('status', 'sent').eq('is_test', false).like('voucher_code', 'WELCOME25-%')
    .in('reminder_status', ['pending', 'failed', 'checking'])
    .gte('expires_at', new Date(now + REMINDER_MIN_HOURS * 3600000).toISOString())
    .lte('expires_at', new Date(now + REMINDER_MAX_HOURS * 3600000).toISOString()).limit(50);
  if (error) throw new Error('Reminder lookup failed');
  const store = reminderStore(db);
  const summary: Record<string, number> = {};
  for (const row of (data ?? []) as ReminderRow[]) {
    const result = await remindOne(store, reminderApi, row, { test: false, claimId: crypto.randomUUID(), now });
    summary[result.status] = (summary[result.status] ?? 0) + 1;
  }
  return { candidates: data?.length ?? 0, summary };
}

export async function runTestReminder(db: DB) {
  const { data, error } = await db.from('app_welcome_vouchers').select(COLUMNS).eq('user_id', TEST_USER_ID).eq('is_test', true).maybeSingle();
  if (error || !data) return { status: 'test_reservation_missing' };
  return remindOne(reminderStore(db), reminderApi, data as ReminderRow, { test: true, claimId: crypto.randomUUID() });
}
