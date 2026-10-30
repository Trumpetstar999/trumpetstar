import type { WelcomeLanguage } from './welcome-content.ts';
import type { ProviderResult } from './welcome-types.ts';

export interface ReminderRow {
  id: string; email: string; language: WelcomeLanguage; first_name: string | null;
  voucher_code: string; expires_at: string; status: string; is_test: boolean;
  reminder_status: string; reminder_attempts: number;
}
export interface ReminderStore {
  /** Atomically moves the row into `next` only while it is still in an allowed state (or a stale pre-send claim). */
  claim(row: ReminderRow, allowed: string[], next: string, claimId: string): Promise<boolean>;
  /** Writes only while the caller still owns the claim. */
  update(row: ReminderRow, claimId: string, values: Record<string, unknown>): Promise<boolean>;
}
export interface VoucherState { active: boolean; reason: string }
export interface ReminderApi {
  voucherState(row: ReminderRow): Promise<VoucherState>;
  mail(row: ReminderRow, test: boolean): Promise<ProviderResult>;
}

export const REMINDER_MIN_HOURS = 23;
export const REMINDER_MAX_HOURS = 25;
export const REMINDER_MAX_ATTEMPTS = 3;
export const REMINDER_STALE_MINUTES = 15;

export function inReminderWindow(expiresAt: string, now = Date.now()) {
  const hours = (new Date(expiresAt).getTime() - now) / 3600000;
  return hours >= REMINDER_MIN_HOURS && hours <= REMINDER_MAX_HOURS;
}

/** Interprets a Digistore24 getVoucher coupon structurally; unknown shapes are never treated as active. */
export function couponState(coupon: unknown, expectedCode: string, expiresAt: string, now = Date.now()): VoucherState {
  if (!coupon || typeof coupon !== 'object') return { active: false, reason: 'voucher_not_found' };
  const c = coupon as Record<string, unknown>;
  if (c.code !== undefined && c.code !== expectedCode) return { active: false, reason: 'voucher_not_found' };
  if (new Date(expiresAt).getTime() <= now) return { active: false, reason: 'expired' };
  const providerExpiry = typeof c.expires_at === 'string' ? Date.parse(c.expires_at.replace(' ', 'T')) : NaN;
  if (!Number.isNaN(providerExpiry) && providerExpiry <= now) return { active: false, reason: 'expired' };
  const active = ['Y', 'y', 'yes', '1', 1, true].includes(c.is_active as never);
  if (!active) return { active: false, reason: 'inactive' };
  const left = Number(c.count_left);
  if (!Number.isFinite(left) || left <= 0) return { active: false, reason: 'redeemed' };
  return { active: true, reason: 'active' };
}

export async function remindOne(store: ReminderStore, api: ReminderApi, row: ReminderRow, opts: { test: boolean; claimId: string; now?: number }) {
  const now = opts.now ?? Date.now();
  if (row.status !== 'sent' || !row.voucher_code.startsWith('WELCOME25-')) return { status: 'not_eligible' };
  if (row.reminder_status === 'sent') return { status: 'sent', alreadySent: true };
  // `sending`/`uncertain` may have reached Brevo; never resend blindly. `skipped` is permanent.
  if (['sending', 'uncertain', 'skipped'].includes(row.reminder_status)) return { status: row.reminder_status };
  if (!opts.test && !inReminderWindow(row.expires_at, now)) return { status: 'outside_window' };
  if (!await store.claim(row, ['pending', 'failed'], 'checking', opts.claimId)) return { status: 'in_progress' };
  const attempts = row.reminder_attempts + 1;
  let state: VoucherState;
  try { state = await api.voucherState(row); }
  catch { state = { active: false, reason: 'lookup_failed' }; }
  if (state.reason === 'lookup_failed') {
    const status = attempts >= REMINDER_MAX_ATTEMPTS ? 'skipped' : 'failed';
    await store.update(row, opts.claimId, { reminder_status: status, reminder_error: 'Digistore24 voucher lookup failed' });
    return { status, reason: 'lookup_failed' };
  }
  if (!state.active) {
    await store.update(row, opts.claimId, { reminder_status: 'skipped', reminder_error: `Skipped: ${state.reason}` });
    return { status: 'skipped', reason: state.reason };
  }
  if (!await store.update(row, opts.claimId, { reminder_status: 'sending', reminder_error: null })) return { status: 'in_progress' };
  let result: ProviderResult;
  try { result = await api.mail(row, opts.test); }
  catch {
    await store.update(row, opts.claimId, { reminder_status: 'uncertain', reminder_error: 'Mail outcome unknown; Brevo reconciliation required' });
    return { status: 'uncertain' };
  }
  if (!result.ok) {
    const status = result.uncertain ? 'uncertain' : attempts >= REMINDER_MAX_ATTEMPTS ? 'skipped' : 'failed';
    await store.update(row, opts.claimId, { reminder_status: status, reminder_error: `Brevo rejected follow-up [${result.status}]` });
    return { status };
  }
  await store.update(row, opts.claimId, { reminder_status: 'sent', reminder_message_id: result.messageId, reminder_sent_at: new Date(now).toISOString(), reminder_error: null });
  return { status: 'sent', alreadySent: false };
}
