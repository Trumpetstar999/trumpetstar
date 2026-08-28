import { corsHeaders, json, normalizeLang } from '../_shared/brevo.ts';
import { adminClient, requireAdmin } from '../_shared/brevo-auth.ts';
import { upsertContact } from '../brevo-sync-contact/index.ts';

type Source = 'leads' | 'users' | 'customers';

interface Contact {
  email: string;
  firstName: string;
  lang: string;
  segment: string;
  source: string;
  isCustomer: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const admin = await requireAdmin(req);
    if (!admin) return json({ error: 'Unauthorized: Admin access required' }, 401);

    const body = (await req.json().catch(() => null)) as { sources?: Source[] } | null;
    const sources: Source[] = Array.isArray(body?.sources) && body!.sources!.length
      ? body!.sources!.filter((s) => ['leads', 'users', 'customers'].includes(s))
      : ['leads', 'users', 'customers'];

    const supabase = adminClient();
    const { data: settings } = await supabase
      .from('brevo_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!settings) return json({ error: 'Brevo settings missing' }, 400);

    const listFor = (lang: string): number | null =>
      (settings[`list_id_${lang}` as 'list_id_de'] as number | null) ?? null;

    const results: Record<string, unknown> = {};

    for (const source of sources) {
      const { data: logRow } = await supabase
        .from('brevo_sync_log')
        .insert({ source })
        .select('id')
        .single();

      let synced = 0;
      let skipped = 0;
      let errors = 0;
      let lastError: string | null = null;

      try {
        const contacts = await collect(supabase, source);
        for (const c of contacts) {
          const listId = listFor(c.lang);
          if (!listId) {
            skipped++;
            continue;
          }
          const res = await upsertContact({ ...c, listId });
          if (res.ok) {
            synced++;
            await supabase.from('brevo_contact_state').upsert(
              {
                email: c.email,
                list_id: listId,
                source: c.source,
                status: 'synced',
                last_error: null,
                last_synced_at: new Date().toISOString(),
              },
              { onConflict: 'email' },
            );
          } else {
            errors++;
            lastError = res.error ?? `status ${res.status}`;
            await supabase.from('brevo_contact_state').upsert(
              {
                email: c.email,
                list_id: listId,
                source: c.source,
                status: 'error',
                last_error: lastError.slice(0, 500),
                last_synced_at: new Date().toISOString(),
              },
              { onConflict: 'email' },
            );
          }
        }
      } catch (e) {
        errors++;
        lastError = String(e);
      }

      if (logRow) {
        await supabase
          .from('brevo_sync_log')
          .update({
            finished_at: new Date().toISOString(),
            synced_count: synced,
            skipped_count: skipped,
            error_count: errors,
            last_error: lastError ? lastError.slice(0, 500) : null,
          })
          .eq('id', logRow.id);
      }

      results[source] = { synced, skipped, errors, lastError };
    }

    return json({ ok: true, results });
  } catch (e) {
    console.error('[brevo-sync-all] error', e);
    return json({ error: String(e) }, 500);
  }
});

// deno-lint-ignore no-explicit-any
async function collect(supabase: any, source: Source): Promise<Contact[]> {
  const map = new Map<string, Contact>();

  if (source === 'leads') {
    const { data } = await supabase
      .from('leads')
      .select('email, first_name, name, language, segment, source');
    for (const l of data ?? []) {
      if (!l.email) continue;
      map.set(l.email.toLowerCase(), {
        email: l.email.toLowerCase(),
        firstName: (l.first_name || l.name || '').slice(0, 100),
        lang: normalizeLang(l.language),
        segment: (l.segment || '').slice(0, 50),
        source: (l.source || 'lead').slice(0, 50),
        isCustomer: false,
      });
    }
  }

  if (source === 'users') {
    const prefs = new Map<string, string>();
    const { data: prefRows } = await supabase.from('user_preferences').select('user_id, language');
    for (const p of prefRows ?? []) if (p.language) prefs.set(p.user_id, p.language);

    const names = new Map<string, string>();
    const { data: profiles } = await supabase.from('profiles').select('id, display_name');
    for (const p of profiles ?? []) if (p.display_name) names.set(p.id, p.display_name);

    let page = 1;
    while (page <= 20) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const users = data?.users ?? [];
      for (const u of users) {
        if (!u.email) continue;
        map.set(u.email.toLowerCase(), {
          email: u.email.toLowerCase(),
          firstName: (names.get(u.id) || (u.user_metadata?.display_name as string) || '').slice(0, 100),
          lang: normalizeLang(prefs.get(u.id)),
          segment: ((u.user_metadata?.segment as string) || '').slice(0, 50),
          source: 'app_user',
          isCustomer: false,
        });
      }
      if (users.length < 200) break;
      page++;
    }
  }

  if (source === 'customers') {
    const langByEmail = new Map<string, string>();
    const { data: leadLangs } = await supabase.from('leads').select('email, language');
    for (const l of leadLangs ?? []) if (l.email && l.language) langByEmail.set(l.email.toLowerCase(), l.language);

    const { data } = await supabase
      .from('digistore24_customers')
      .select('email, first_name, last_name, country');
    for (const c of data ?? []) {
      if (!c.email) continue;
      const email = c.email.toLowerCase();
      map.set(email, {
        email,
        firstName: (c.first_name || '').slice(0, 100),
        lang: normalizeLang(langByEmail.get(email) ?? countryToLang(c.country)),
        segment: 'customer',
        source: 'digistore24',
        isCustomer: true,
      });
    }
  }

  return [...map.values()];
}

function countryToLang(country: string | null): string {
  const c = (country || '').toUpperCase();
  if (['DE', 'AT', 'CH'].includes(c)) return 'de';
  if (['ES', 'MX', 'AR', 'CO', 'CL', 'PE'].includes(c)) return 'es';
  if (['SI'].includes(c)) return 'sl';
  return 'de';
}
