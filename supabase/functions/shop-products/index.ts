import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { initialShopVisibility } from './visibility.ts';

const CACHE_MS = 60 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toIso(v: unknown): string | null {
  if (typeof v !== 'string' || !v) return null;
  const d = new Date(v.replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Public: refreshes the product cache at most hourly; manual fields are never overwritten. */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ refreshed: false, reason: 'not_configured' }, 503);
  const db = createClient(url, serviceKey);

  let reconcile = false;
  if (req.method === 'POST') {
    let input: unknown;
    try { input = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => k !== 'reconcile') || ('reconcile' in input && typeof input.reconcile !== 'boolean')) return json({ error: 'Invalid request' }, 400);
    reconcile = 'reconcile' in input && input.reconcile === true;
  }
  // Only a verified admin may intentionally republish the existing catalog.
  if (reconcile) {
    const bearer = req.headers.get('Authorization');
    if (!bearer?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const { data: auth, error } = await db.auth.getUser(bearer.slice(7));
    if (error || !auth.user) return json({ error: 'Unauthorized' }, 401);
    const { data: role } = await db.from('user_roles').select('role').eq('user_id', auth.user.id).eq('role', 'admin').maybeSingle();
    if (!role) return json({ error: 'Forbidden' }, 403);
  }

  const { data: latest } = await db.from('shop_products').select('synced_at').order('synced_at', { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
  const last = latest?.synced_at ? Date.parse(latest.synced_at) : 0;
  if (!reconcile && Date.now() - last < CACHE_MS) return json({ refreshed: false });

  const key = Deno.env.get('DIGISTORE24_API_KEY');
  if (!key) return json({ refreshed: false, reason: 'not_configured' });
  try {
    const res = await fetch('https://www.digistore24.com/api/call/listProducts', {
      headers: { 'X-DS-API-KEY': key, Accept: 'application/json' },
    });
    const body = await res.json();
    if (body?.result !== 'success') return json({ refreshed: false, reason: 'provider_error' });
    const raw = body.data?.products ?? body.data?.product_list ?? body.data?.items ?? body.data ?? [];
    const list: Record<string, unknown>[] = Array.isArray(raw) ? raw : Object.values(raw);
    const now = new Date().toISOString();

    const { data: existing } = await db.from('shop_products').select('id, price');
    const known = new Set((existing ?? []).map((r) => r.id));

    for (const p of list) {
      const id = String(p.id ?? p.product_id ?? '');
      if (!/^\d+$/.test(id)) continue;
      const name = String(p.name ?? p.name_intern ?? p.product_name ?? '').trim();
      if (!name) continue;
      const price = num(p.price ?? p.amount ?? p.first_amount);
      const created = toIso(p.created_at) ?? now;
      const active = initialShopVisibility(p.is_active);
      if (known.has(id)) {
        const patch: Record<string, unknown> = { name, created_at: created, synced_at: now };
        if (price != null && existing?.find((r) => r.id === id)?.price == null) patch.price = price;
        if (reconcile) patch.visible = active;
        const { error } = await db.from('shop_products').update(patch).eq('id', id);
        if (error) throw new Error('cache_write_failed');
      } else {
        const { error } = await db.from('shop_products').insert({
          id, name, price, currency: String(p.currency ?? 'EUR'), created_at: created,
          order_url: `https://www.digistore24.com/product/${id}`, visible: active, synced_at: now,
        });
        if (error) throw new Error('cache_write_failed');
      }
    }
    // Mark sync time even when nothing changed so the hourly gate holds.
    await db.from('shop_products').update({ synced_at: now }).is('synced_at', null);
    return json({ refreshed: true, count: list.length });
  } catch {
    return json({ refreshed: false, reason: 'provider_unreachable' });
  }
});
