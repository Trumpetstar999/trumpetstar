import { corsHeaders, json, normalizeLang, upsertContact } from '../_shared/brevo.ts';
import { adminClient, getCaller, isInternalCall, requireAdmin } from '../_shared/brevo-auth.ts';
import { deliverWelcome, welcomeStore } from './welcome-delivery.ts';
import { TEST_EMAIL, welcomeLanguage } from './welcome-content.ts';

interface Payload {
  email?: string;
  first_name?: string | null;
  language?: string | null;
  segment?: string | null;
  source?: string | null;
  is_customer?: boolean;
  force?: boolean;
  test_welcome?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = (await req.json().catch(() => null)) as Payload | null;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid request' }, 400);
    if (body.test_welcome !== undefined && typeof body.test_welcome !== 'boolean') return json({ error: 'Invalid test flag' }, 400);
    if (body.language != null && typeof body.language !== 'string') return json({ error: 'Invalid language' }, 400);
    if (body.first_name != null && typeof body.first_name !== 'string') return json({ error: 'Invalid first name' }, 400);
    const appUser = body.source === 'app_user';
    const test = body.test_welcome === true;
    const caller = appUser || test ? await getCaller(req) : null;
    if ((appUser || test) && (!req.headers.get('Authorization')?.startsWith('Bearer ') || !caller?.email)) return json({ error: 'Unauthorized' }, 401);
    if (test && !await requireAdmin(req)) return json({ error: 'Admin required' }, 403);
    const email = test ? TEST_EMAIL : appUser ? caller?.email?.toLowerCase().trim() ?? '' : typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
    if (!email || !EMAIL_RE.test(email)) return json({ error: 'Valid email is required' }, 400);

    // Allowed callers: internal edge functions, admins, or a signed-in user syncing their own address
    const internal = isInternalCall(req);
    if (!internal && !appUser && !test) {
      const isAdmin = !!(await requireAdmin(req));
      if (!isAdmin) {
        const caller = await getCaller(req);
        if (!caller || caller.email?.toLowerCase() !== email) {
          return json({ error: 'Unauthorized' }, 401);
        }
      }
    }


    const supabase = adminClient();
    const lang = appUser || test ? welcomeLanguage(body.language) : normalizeLang(body.language);
    // Test is isolated from contact lists and real user identities, with a single permanent ledger reservation.
    const welcome = async () => {
      if (!caller) return null;
      const missing = ['DIGISTORE24_API_KEY', 'BREVO_API_KEY', 'LOVABLE_API_KEY'].filter(name => !Deno.env.get(name));
      if (missing.length) return { status: 'configuration_missing', missing };
      return await deliverWelcome(welcomeStore(supabase), { userId: caller.id, email, lang,
        firstName: typeof body.first_name === 'string' ? body.first_name.trim().split(/\s+/)[0].slice(0, 100) || null : null, test });
    };
    if (test) {
      const result = await welcome();
      return json({ ok: result?.status === 'sent', welcome: result }, result?.status === 'sent' ? 200 : 503);
    }
    const { data: settings } = await supabase
      .from('brevo_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!settings) return json({ error: 'Brevo settings missing', welcome: appUser ? await welcome() : null }, 400);
    if (!settings.auto_sync_enabled && !body?.force) {
      return json({ skipped: true, reason: 'auto_sync_disabled', welcome: appUser ? await welcome() : null });
    }

    const listId = settings[`list_id_${lang}` as 'list_id_de'] as number | null;
    if (!listId) return json({ skipped: true, reason: `no_list_for_${lang}`, welcome: appUser ? await welcome() : null });

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
      return json({ error: 'Brevo request failed', status: result.status, details: result.error, welcome: appUser ? await welcome() : null }, result.status || 500);
    }
    const delivery = appUser ? await welcome() : null;
    return json({ ok: !delivery || delivery.status === 'sent', listId, welcome: delivery }, delivery && delivery.status !== 'sent' ? 503 : 200);
  } catch (e) {
    console.error('[brevo-sync-contact] operation failed');
    return json({ error: 'Contact or welcome operation failed; retry only after checking delivery status' }, 500);
  }
});
