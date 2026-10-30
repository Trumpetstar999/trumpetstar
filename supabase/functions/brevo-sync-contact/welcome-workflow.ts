import type { WelcomeStore, ProviderResult } from './welcome-types.ts';
export async function deliverWelcome(store: WelcomeStore, input: Parameters<WelcomeStore['reserve']>[0], api: { voucher(row: import('./welcome-types.ts').WelcomeRow): Promise<ProviderResult>; mail(row: import('./welcome-types.ts').WelcomeRow): Promise<ProviderResult> }) {
  const row = await store.reserve(input);
  if (row.status === 'sent') return { status: 'sent', alreadySent: true };
  // Existing offers must be reconciled at the provider, never relabeled by a mail retry.
  if (!row.voucher_code.startsWith('WELCOME25-')) return { status: 'legacy_offer_reconciliation_required' };
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