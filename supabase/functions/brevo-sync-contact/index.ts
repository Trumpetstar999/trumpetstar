import { corsHeaders, json, normalizeLang, upsertContact } from '../_shared/brevo.ts';
import { adminClient, isInternalCall, requireAdmin } from '../_shared/brevo-auth.ts';

interface Payload {
  email?: string;
  first_name?: string | null;
  language?: string | null;
  segment?: string | null;
  source?: string | null;
  is_customer?: boolean;
  force?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const internal = isInternalCall(req);
    if (!internal && !(await requireAdmin(req))) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = (await req.json().catch(() => null)) as Payload | null;
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
    if (!email || !EMAIL_RE.test(email)) return json({ error: 'Valid email is required' }, 400);

    const supabase = adminClient();
    const { data: settings } = await supabase
      .from('brevo_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!settings) return json({ error: 'Brevo settings missing' }, 400);
    if (!settings.auto_sync_enabled && !body?.force) {
      return json({ skipped: true, reason: 'auto_sync_disabled' });
    }

    const lang = normalizeLang(body?.language);
    const listId = settings[`list_id_${lang}` as 'list_id_de'] as number | null;
    if (!listId) return json({ skipped: true, reason: `no_list_for_${lang}` });

    const result = await upsertContact({
      email,
      firstName: typeof body?.first_name === 'string' ? body.first_name.slice(0, 100) : '',
      lang,
      segment: typeof body?.segment === 'string' ? body.segment.slice(0, 50) : '',
      source: typeof body?.source === 'string' ? body.source.slice(0, 50) : '',
      isCustomer: !!body?.is_customer,
      listId,
    });

    await supabase.from('brevo_contact_state').upsert(
      {
        email,
        list_id: listId,
        source: typeof body?.source === 'string' ? body.source.slice(0, 50) : null,
        status: result.ok ? 'synced' : 'error',
        last_error: result.ok ? null : result.error ?? null,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'email' },
    );

    if (!result.ok) {
      return json({ error: 'Brevo request failed', status: result.status, details: result.error }, result.status || 500);
    }
    return json({ ok: true, listId });
  } catch (e) {
    console.error('[brevo-sync-contact] error', e);
    return json({ error: String(e) }, 500);
  }
});
