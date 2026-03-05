import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  order_id: string;
  product_id: string;
  email: string;
  first_name: string;
  last_name: string;
  country: string;
  first_payment_at: string;
  total_revenue: string;
  payment_status: string;
  next_payment_at: string;
  billing_type: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is an authenticated admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { rows }: { rows: CSVRow[] } = await req.json();

    if (!rows || !Array.isArray(rows)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Pre-fetch all existing auth users once (avoid N+1 listUsers calls)
    const { data: allAuthData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existingAuthMap = new Map<string, string>(); // email → user_id
    for (const u of allAuthData?.users ?? []) {
      if (u.email) existingAuthMap.set(u.email.toLowerCase(), u.id);
    }

    for (const row of rows) {
      try {
        const email = row.email?.toLowerCase().trim();
        if (!email) { skipped++; continue; }

        const isActive = row.payment_status?.trim() === 'Zahlungen aktiv';
        const subscriptionStatus = isActive ? 'active' : 'cancelled';

        // Parse revenue – strip currency symbols
        const revenueRaw = row.total_revenue?.replace(/[^0-9,.]/g, '').replace(',', '.') ?? '0';
        const revenue = parseFloat(revenueRaw) || 0;

        // Parse DD.MM.YYYY → YYYY-MM-DD
        const parseDate = (str: string): string | null => {
          if (!str) return null;
          const parts = str.trim().split('.');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
          return str || null;
        };

        const firstPurchaseAt = parseDate(row.first_payment_at);
        const nextPaymentAt = parseDate(row.next_payment_at);

        // ── 1. Ensure Auth account exists ────────────────────────────────────
        let authUserId = existingAuthMap.get(email) ?? null;

        if (!authUserId) {
          // Invite creates the account and sends a magic-link invitation email
          const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
            email,
            {
              data: {
                first_name: row.first_name?.trim() || null,
                last_name: row.last_name?.trim() || null,
              },
            }
          );
          if (inviteErr) {
            errors.push(`${email}: Auth invite failed – ${inviteErr.message}`);
            continue;
          }
          authUserId = inviteData.user.id;
          existingAuthMap.set(email, authUserId);
        }

        // ── 2. Upsert CRM customer record ────────────────────────────────────
        const { error: custErr } = await supabase
          .from('digistore24_customers')
          .upsert({
            email,
            first_name: row.first_name?.trim() || null,
            last_name: row.last_name?.trim() || null,
            country: row.country?.trim() || null,
            first_purchase_at: firstPurchaseAt,
            total_revenue: revenue,
            total_purchases: 1,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email', ignoreDuplicates: false });

        if (custErr) {
          errors.push(`${email}: Customer upsert failed – ${custErr.message}`);
          continue;
        }

        // ── 3. Upsert subscription ───────────────────────────────────────────
        const { error: subErr } = await supabase
          .from('digistore24_subscriptions')
          .upsert({
            digistore_order_id: row.order_id?.trim(),
            digistore_product_id: row.product_id?.trim(),
            user_id: authUserId,
            status: subscriptionStatus,
            current_period_start: firstPurchaseAt,
            current_period_end: nextPaymentAt,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'digistore_order_id', ignoreDuplicates: false });

        if (subErr) {
          errors.push(`${email}: Subscription upsert failed – ${subErr.message}`);
          continue;
        }

        // ── 4. Set PRO membership if subscription is active ──────────────────
        if (isActive) {
          await supabase
            .from('user_memberships')
            .upsert({
              user_id: authUserId,
              plan_key: 'PRO',
              current_plan: 'PRO',
              plan_rank: 3,
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id', ignoreDuplicates: false });
        }

        imported++;
      } catch (rowErr: any) {
        errors.push(`${row.email}: ${rowErr.message}`);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, imported, skipped, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
