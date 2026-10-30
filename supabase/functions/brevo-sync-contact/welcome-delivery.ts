import { adminClient } from '../_shared/brevo-auth.ts';
import { brevoFetch } from '../_shared/brevo.ts';
import { TEST_EMAIL, TEST_USER_ID, voucherExpiry, voucherFields, welcomeEmail, type WelcomeLanguage } from './welcome-content.ts';

type DB = ReturnType<typeof adminClient>;
export interface WelcomeRow {
  id: string; user_id: string; email: string; language: WelcomeLanguage;
  voucher_code: string; expires_at: string; created_at: string; status: string;
  first_name: string | null; brevo_message_id: string | null;
}
export interface WelcomeStore {
  reserve(input: { userId: string; email: string; lang: WelcomeLanguage; firstName: string | null; test: boolean }): Promise<WelcomeRow>;
  claim(row: WelcomeRow, allowed: string[], next: string): Promise<boolean>;
  update(id: string, values: Record<string, unknown>): Promise<void>;
}
export function welcomeStore(db: DB): WelcomeStore {
  return {
    async reserve(input) {
      const createdAt = new Date().toISOString();
      const code = `WELCOME15-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`;
      const { data, error } = await db.from('app_welcome_vouchers').insert({
        user_id: input.test ? TEST_USER_ID : input.userId, email: input.test ? TEST_EMAIL : input.email,
        language: input.lang, first_name: input.firstName, voucher_code: code,
        created_at: createdAt, expires_at: voucherExpiry(createdAt), is_test: input.test,
      }).select('*').single();
      if (!error) return data as WelcomeRow;
      if (error.code !== '23505') throw new Error('Welcome reservation failed');
      // Unique constraints arbitrate concurrent requests and repeated addresses, including test recipient.
      const { data: byUser, error: readError } = await db.from('app_welcome_vouchers').select('*')
        .eq('user_id', input.test ? TEST_USER_ID : input.userId).maybeSingle();
      if (readError) throw new Error('Welcome lookup failed');
      if (byUser) return byUser as WelcomeRow;
      const { data: byEmail, error: emailError } = await db.from('app_welcome_vouchers').select('*')
        .eq('email', input.test ? TEST_EMAIL : input.email).single();
      if (emailError || !byEmail) throw new Error('Welcome identity already reserved');
      return byEmail as WelcomeRow;
    },
    async claim(row, allowed, next) {
      const { data, error } = await db.from('app_welcome_vouchers').update({ status: next, error_message: null, updated_at: new Date().toISOString() })
        .eq('id', row.id).in('status', allowed).select('id');
      if (error) throw new Error('Welcome claim failed');
      return !!data?.length;
    },
    async update(id, values) {
      const { error } = await db.from('app_welcome_vouchers').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error('Welcome persistence failed; reconciliation required');
    },
  };
}
export interface ProviderResult { ok: boolean; uncertain?: boolean; status: number; messageId?: string }
export const providers = {
  async voucher(row: WelcomeRow): Promise<ProviderResult> {
    const key = Deno.env.get('DIGISTORE24_API_KEY');
    if (!key) throw new Error('DIGISTORE24_API_KEY is not configured');
    const response = await fetch('https://www.digistore24.com/api/call/createVoucher', {
      method: 'POST', headers: { 'X-DS-API-KEY': key, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: voucherFields(row.voucher_code, row.created_at, row.expires_at), signal: AbortSignal.timeout(20000),
    });
    const text = await response.text();
    let body: { result?: string; data?: { code?: string } } | null = null;
    try { body = JSON.parse(text); } catch { /* Never log raw provider data or credentials. */ }
    const ok = response.ok && body?.result === 'success';
    return { ok, status: response.status, uncertain: !ok && (response.status >= 500 || response.ok) };
  },
  async mail(row: WelcomeRow): Promise<ProviderResult> {
    const result = await brevoFetch('/smtp/email', { method: 'POST', body: {
      sender: { name: 'Trumpetstar GmbH', email: 'info@trumpetstar.com' },
      to: [{ email: row.email, ...(row.first_name ? { name: row.first_name } : {}) }],
      ...welcomeEmail(row.language, row.first_name, row.voucher_code, row.expires_at),
      tags: ['app-welcome-voucher'],
    } });
    const data = result.data as { messageId?: string } | null;
    return { ok: result.ok && !!data?.messageId, messageId: data?.messageId, status: result.status,
      uncertain: result.status >= 500 || (result.ok && !data?.messageId) };
  },
};
export async function deliverWelcome(store: WelcomeStore, input: Parameters<WelcomeStore['reserve']>[0], api = providers) {
  const row = await store.reserve(input);
  if (row.status === 'sent') return { status: 'sent', alreadySent: true };
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    if (['pending', 'voucher_failed', 'voucher_created', 'mail_failed'].includes(row.status)) await store.update(row.id, { status: 'expired' });
    return { status: row.status.includes('uncertain') ? row.status : 'expired' };
  }
  if (['pending', 'voucher_failed'].includes(row.status)) {
    if (!await store.claim(row, ['pending', 'voucher_failed'], 'voucher_creating')) return { status: 'in_progress' };
    let result: ProviderResult;
    try { result = await api.voucher(row); }
    catch { await store.update(row.id, { status: 'voucher_uncertain', error_message: 'Voucher outcome unknown; provider reconciliation required' }); return { status: 'voucher_uncertain' }; }
    if (!result.ok) {
      const status = result.uncertain ? 'voucher_uncertain' : 'voucher_failed';
      await store.update(row.id, { status, error_message: `Digistore24 rejected voucher [${result.status}]` });
      return { status };
    }
    await store.update(row.id, { status: 'voucher_created', error_message: null });
    row.status = 'voucher_created';
  }
  if (!['voucher_created', 'mail_failed'].includes(row.status)) return { status: row.status };
  if (!await store.claim(row, ['voucher_created', 'mail_failed'], 'sending')) return { status: 'in_progress' };
  let result: ProviderResult;
  try { result = await api.mail(row); }
  catch { await store.update(row.id, { status: 'mail_uncertain', error_message: 'Mail outcome unknown; Brevo reconciliation required' }); return { status: 'mail_uncertain' }; }
  if (!result.ok) {
    const status = result.uncertain ? 'mail_uncertain' : 'mail_failed';
    await store.update(row.id, { status, error_message: `Brevo rejected mail [${result.status}]` });
    return { status };
  }
  await store.update(row.id, { status: 'sent', brevo_message_id: result.messageId, sent_at: new Date().toISOString(), error_message: null });
  return { status: 'sent', alreadySent: false };
}