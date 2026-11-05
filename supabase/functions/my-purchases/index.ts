import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { belongsToBuyer, summarizePurchases, type Raw } from './purchases.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'Service unavailable' }, 503);
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const bearer = req.headers.get('Authorization');
  if (!bearer?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
  const { data: auth, error: authError } = await admin.auth.getUser(bearer.slice(7));
  const user = auth?.user;
  if (authError || !user?.email || !user.email_confirmed_at) return json({ error: 'Unauthorized' }, 401);
  // No identity selectors or arbitrary order/URL inputs are accepted.
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length) return json({ error: 'Unexpected input' }, 400);
  } catch { return json({ error: 'Invalid input' }, 400); }
  try {
    const email = user.email.trim().toLowerCase();
    const { data: customers, error: customerError } = await admin.from('digistore24_customers').select('id,email').ilike('email', email.replaceAll('%', '\\%').replaceAll('_', '\\_'));
    if (customerError) throw customerError;
    const customerIds = (customers || []).filter(c => c.email.toLowerCase().trim() === email).map(c => c.id);
    let cached: Raw[] = [];
    if (customerIds.length) {
      const { data, error } = await admin.from('digistore24_transactions').select('digistore_transaction_id,product_id,product_name,amount,currency,status,pay_date,refund_date,created_at,raw_data').in('customer_id', customerIds).order('pay_date', { ascending: false });
      if (error) throw error;
      cached = (data || []) as Raw[];
    }
    const apiKey = Deno.env.get('DIGISTORE24_API_KEY');
    let live: Raw[] = [];
    let providerAvailable = false;
    if (apiKey) {
      try {
        for (let page = 1; page <= 100; page++) {
          const endpoint = new URL('https://www.digistore24.com/api/call/listPurchases');
          endpoint.searchParams.set('from', '2015-01-01');
          endpoint.searchParams.set('search[email]', email);
          endpoint.searchParams.set('page_no', String(page));
          endpoint.searchParams.set('page_size', '100');
          const response = await fetch(endpoint, { headers: { 'X-DS-API-KEY': apiKey, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
          if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
          const result = await response.json();
          if (result.result !== 'success') throw new Error('Provider rejected query');
          const data = result.data || {};
          const items: Raw[] = Array.isArray(data.purchase_list) ? data.purchase_list : Object.values(data.purchase_list || {});
          // Independently verify every returned buyer even when the provider filter succeeds.
          live.push(...items.filter(p => {
            const buyer = p.buyer as Raw | undefined;
            return typeof buyer?.email === 'string' && buyer.email.trim().toLowerCase() === email;
          }));
          if (page >= Number(data.page_count || 1) || !items.length) { providerAvailable = true; break; }
        }
      } catch { console.warn('[my-purchases] provider unavailable; using verified saved history'); live = []; }
    }
    const rows = providerAvailable ? live : cached;
    const orderIds = [...new Set(rows.map(p => String((p.raw_data as Raw | undefined)?.order_id || (p.raw_data as Raw | undefined)?.id || p.id || '')).filter(Boolean))];
    const owners = new Map<string, string>();
    if (orderIds.length) {
      const { data, error } = await admin.from('digistore24_subscriptions').select('digistore_order_id,user_id').in('digistore_order_id', orderIds);
      if (error) throw error;
      for (const owner of data || []) owners.set(owner.digistore_order_id, owner.user_id);
    }
    const ownedRows = rows.filter(p => {
      const raw = (p.raw_data || p) as Raw;
      const buyer = raw.buyer as Raw | undefined;
      return belongsToBuyer(email, providerAvailable ? buyer?.email : email, String(raw.order_id || raw.id || ''), owners, user.id);
    });
    return json({ purchases: summarizePurchases(ownedRows), source: providerAvailable ? 'live' : 'saved', checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[my-purchases] history unavailable', error instanceof Error ? error.name : 'error');
    return json({ error: 'Purchase history unavailable' }, 503);
  }
});