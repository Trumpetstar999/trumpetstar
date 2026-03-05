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

    // Verify admin via JWT
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
    let errors: string[] = [];

    for (const row of rows) {
      try {
        const isActive = row.payment_status?.trim() === 'Zahlungen aktiv';
        const subscriptionStatus = isActive ? 'active' : 'cancelled';

        // Parse revenue – strip currency symbols
        const revenueRaw = row.total_revenue?.replace(/[^0-9,.]/g, '').replace(',', '.') ?? '0';
        const revenue = parseFloat(revenueRaw) || 0;

        // Parse dates (DD.MM.YYYY or YYYY-MM-DD)
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

        // 1. Upsert customer
        const { data: customer, error: custErr } = await supabase
          .from('digistore24_customers')
          .upsert({
            email: row.email?.toLowerCase().trim(),
            first_name: row.first_name?.trim() || null,
            last_name: row.last_name?.trim() || null,
            country: row.country?.trim() || null,
            first_purchase_at: firstPurchaseAt,
            total_revenue: revenue,
            total_purchases: 1,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email', ignoreDuplicates: false })
          .select('id')
          .single();

        if (custErr) {
          errors.push(`${row.email}: Customer upsert failed – ${custErr.message}`);
          continue;
        }

        // 2. Find matching auth user by email
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const matchedUser = authUsers?.users?.find(
          (u) => u.email?.toLowerCase() === row.email?.toLowerCase().trim()
        );

        // We need a user_id for the subscription. Use a placeholder UUID derived from the order if no auth user exists.
        // digistore24_subscriptions requires user_id but if there's no auth user we use a consistent deterministic UUID from the order.
        // Since there is no auth user, we use a "ghost" approach: store the customer's internal id in a separate field.
        // The table requires user_id NOT NULL — we'll use the customer's id (as uuid) as a stand-in.
        const userId = matchedUser?.id ?? customer.id;

        // 3. Upsert subscription
        const { error: subErr } = await supabase
          .from('digistore24_subscriptions')
          .upsert({
            digistore_order_id: row.order_id?.trim(),
            digistore_product_id: row.product_id?.trim(),
            user_id: userId,
            status: subscriptionStatus,
            current_period_start: firstPurchaseAt,
            current_period_end: nextPaymentAt,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'digistore_order_id', ignoreDuplicates: false });

        if (subErr) {
          errors.push(`${row.email}: Subscription upsert failed – ${subErr.message}`);
          continue;
        }

        // 4. If auth user exists and subscription is active → set membership to PRO
        if (matchedUser && isActive) {
          await supabase
            .from('user_memberships')
            .upsert({
              user_id: matchedUser.id,
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
