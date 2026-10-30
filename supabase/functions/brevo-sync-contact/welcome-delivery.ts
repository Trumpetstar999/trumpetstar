import { adminClient } from '../_shared/brevo-auth.ts';
import { brevoFetch } from '../_shared/brevo.ts';
import { TEST_EMAIL, TEST_USER_ID, voucherExpiry, voucherFields, welcomeEmail, type WelcomeLanguage } from './welcome-content.ts';

type DB = ReturnType<typeof adminClient>;
import type { WelcomeRow, WelcomeStore, ProviderResult } from './welcome-types.ts';
export { deliverWelcome } from './welcome-workflow.ts';
export function welcomeStore(db: DB): WelcomeStore {
  return {
    async reserve(input) {
      const createdAt = new Date().toISOString();
      const code = `WELCOME15-${crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
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
export const providers = {
  async inspectVoucher(row: WelcomeRow) {
    const key = Deno.env.get('DIGISTORE24_API_KEY');
    if (!key) return { confirmed: false, reason: 'configuration_missing' };
    const url = new URL('https://www.digistore24.com/api/call/getVoucher');
    url.searchParams.set('code', row.voucher_code);
    const response = await fetch(url, { headers: { 'X-DS-API-KEY': key, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    const body = await response.json().catch(() => null);
    const data = body?.data;
    // Read-only reconciliation: only positively identified provider records can advance delivery.
    const confirmed = response.ok && body?.result === 'success' && (data?.code === row.voucher_code || data?.voucher?.code === row.voucher_code);
    return { confirmed, reason: confirmed ? 'voucher_found' : body?.result === 'error' ? 'provider_lookup_rejected' : 'provider_lookup_unconfirmed',
      ...(!confirmed ? { diagnostic: { http_status: response.status, json_received: body !== null, success_result: body?.result === 'success', explicit_error: body?.result === 'error' } } : {}) };
  },
  async voucher(row: WelcomeRow): Promise<ProviderResult> {
    const key = Deno.env.get('DIGISTORE24_API_KEY');
    if (!key) throw new Error('DIGISTORE24_API_KEY is not configured');
    const response = await fetch('https://www.digistore24.com/api/call/createVoucher', {
      method: 'POST', headers: { 'X-DS-API-KEY': key, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: voucherFields(row.voucher_code, row.created_at, row.expires_at), signal: AbortSignal.timeout(20000),
    });
    const text = await response.text();
    let body: { result?: string; data?: { code?: string } } | null = null;
    try { body = JSON.parse(text); } catch { /* Never log raw provider data or credentials. */ }
    const ok = response.ok && body?.result === 'success';
    return { ok, status: response.status, uncertain: !ok && (response.status >= 500 || response.ok) };
  },
  async mail(row: WelcomeRow): Promise<ProviderResult> {
    const result = await brevoFetch('/smtp/email', { method: 'POST', logErrors: false, body: {
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
