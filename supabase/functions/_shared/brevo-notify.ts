/**
 * Fire-and-forget push of a single contact to Brevo via the brevo-sync-contact function.
 * Never throws — Brevo problems must not break lead capture or IPN processing.
 */
export async function notifyBrevo(contact: {
  email: string;
  first_name?: string | null;
  language?: string | null;
  segment?: string | null;
  source?: string | null;
  is_customer?: boolean;
}): Promise<void> {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return;

    const res = await fetch(`${url}/functions/v1/brevo-sync-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'x-internal-secret': serviceKey,
      },
      body: JSON.stringify(contact),
    });
    if (!res.ok) {
      console.warn('[brevo-notify] sync failed', res.status, await res.text());
    }
  } catch (e) {
    console.warn('[brevo-notify] error', e);
  }
}
