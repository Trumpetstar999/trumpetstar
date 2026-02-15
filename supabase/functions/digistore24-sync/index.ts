import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DS24_API_BASE = "https://www.digistore24.com/api/v1";

async function ds24Request(apiKey: string, endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${DS24_API_BASE}/${endpoint}`);
  url.searchParams.set("token", apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`DS24 API error: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.result !== "success" && json.retval === undefined) {
    throw new Error(`DS24 API: ${json.message || JSON.stringify(json)}`);
  }
  return json;
}

async function fetchAllPages(apiKey: string, endpoint: string, extraParams: Record<string, string> = {}): Promise<any[]> {
  const allItems: any[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const params = { ...extraParams, page: String(page), items_per_page: String(perPage) };
    const json = await ds24Request(apiKey, endpoint, params);
    
    const items = json.data?.items || json.data || json.retval?.items || json.retval || [];
    if (!Array.isArray(items) || items.length === 0) break;
    
    allItems.push(...items);
    
    const totalPages = json.data?.total_pages || json.retval?.total_pages || 1;
    if (page >= totalPages) break;
    page++;
  }

  return allItems;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }
  const userId = claimsData.claims.sub;

  // Admin check
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  // Get API key
  const apiKey = Deno.env.get("DIGISTORE24_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "DIGISTORE24_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create sync log
  const { data: syncLog } = await supabase
    .from("digistore24_sync_log")
    .insert({ sync_type: "manual", status: "running" })
    .select()
    .single();

  const syncId = syncLog?.id;

  try {
    // 1. Fetch all transactions (purchases/orders)
    console.log("Fetching transactions from DS24...");
    const transactions = await fetchAllPages(apiKey, "listTransactions");
    console.log(`Fetched ${transactions.length} transactions`);

    // 2. Fetch all subscriptions
    console.log("Fetching subscriptions from DS24...");
    let subscriptions: any[] = [];
    try {
      subscriptions = await fetchAllPages(apiKey, "listSubscriptions");
      console.log(`Fetched ${subscriptions.length} subscriptions`);
    } catch (e) {
      console.warn("Could not fetch subscriptions:", e);
    }

    // 3. Deduplicate customers by email
    const customerMap = new Map<string, any>();
    
    for (const t of transactions) {
      const email = (t.email || t.buyer_email || t.customer_email || "").toLowerCase().trim();
      if (!email) continue;

      if (!customerMap.has(email)) {
        customerMap.set(email, {
          email,
          digistore_customer_id: t.customer_id || t.buyer_id || null,
          first_name: t.first_name || t.buyer_first_name || "",
          last_name: t.last_name || t.buyer_last_name || "",
          company: t.company || t.buyer_company || null,
          country: t.country || t.buyer_country || null,
          phone: t.phone || t.buyer_phone || null,
          total_purchases: 0,
          total_revenue: 0,
          first_purchase_at: null as string | null,
          last_purchase_at: null as string | null,
        });
      }

      const c = customerMap.get(email)!;
      const amount = parseFloat(t.amount || t.billing_amount || "0") || 0;
      const payDate = t.pay_date || t.order_date || t.created_at || null;
      
      if (t.transaction_status === "completed" || t.status === "completed" || !t.transaction_status) {
        c.total_purchases++;
        c.total_revenue += amount;
      }

      if (payDate) {
        if (!c.first_purchase_at || payDate < c.first_purchase_at) c.first_purchase_at = payDate;
        if (!c.last_purchase_at || payDate > c.last_purchase_at) c.last_purchase_at = payDate;
      }
    }

    // 4. Upsert customers
    let customersImported = 0;
    let customersUpdated = 0;

    for (const customer of customerMap.values()) {
      const { data: existing } = await supabase
        .from("digistore24_customers")
        .select("id")
        .eq("email", customer.email)
        .maybeSingle();

      const customerData = {
        ...customer,
        first_purchase_at: customer.first_purchase_at ? new Date(customer.first_purchase_at).toISOString() : null,
        last_purchase_at: customer.last_purchase_at ? new Date(customer.last_purchase_at).toISOString() : null,
      };

      if (existing) {
        await supabase
          .from("digistore24_customers")
          .update(customerData)
          .eq("id", existing.id);
        customersUpdated++;
      } else {
        await supabase
          .from("digistore24_customers")
          .insert(customerData);
        customersImported++;
      }
    }

    // 5. Upsert transactions
    let txImported = 0;
    let txUpdated = 0;

    for (const t of transactions) {
      const email = (t.email || t.buyer_email || t.customer_email || "").toLowerCase().trim();
      const transactionId = t.transaction_id || t.order_id || t.id;
      if (!transactionId) continue;

      // Find customer
      let customerId: string | null = null;
      if (email) {
        const { data: cust } = await supabase
          .from("digistore24_customers")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        customerId = cust?.id || null;
      }

      const txData = {
        digistore_transaction_id: String(transactionId),
        customer_id: customerId,
        product_id: t.product_id || null,
        product_name: t.product_name || t.product_title || null,
        amount: parseFloat(t.amount || t.billing_amount || "0") || 0,
        currency: t.currency || "EUR",
        status: t.transaction_status || t.status || "completed",
        payment_method: t.payment_method || t.pay_method || null,
        pay_date: t.pay_date || t.order_date ? new Date(t.pay_date || t.order_date).toISOString() : null,
        refund_date: t.refund_date ? new Date(t.refund_date).toISOString() : null,
        raw_data: t,
      };

      const { data: existingTx } = await supabase
        .from("digistore24_transactions")
        .select("id")
        .eq("digistore_transaction_id", txData.digistore_transaction_id)
        .maybeSingle();

      if (existingTx) {
        await supabase
          .from("digistore24_transactions")
          .update(txData)
          .eq("id", existingTx.id);
        txUpdated++;
      } else {
        await supabase
          .from("digistore24_transactions")
          .insert(txData);
        txImported++;
      }
    }

    // 6. Upsert subscriptions into existing digistore24_subscriptions table is handled by IPN
    // Here we just track subscription data in transactions

    const totalImported = customersImported + txImported;
    const totalUpdated = customersUpdated + txUpdated;

    // Update sync log
    if (syncId) {
      await supabase
        .from("digistore24_sync_log")
        .update({
          status: "success",
          records_imported: totalImported,
          records_updated: totalUpdated,
          completed_at: new Date().toISOString(),
        })
        .eq("id", syncId);
    }

    return new Response(JSON.stringify({
      success: true,
      customers: { imported: customersImported, updated: customersUpdated },
      transactions: { imported: txImported, updated: txUpdated },
      total: { imported: totalImported, updated: totalUpdated },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Sync error:", error);

    if (syncId) {
      await supabase
        .from("digistore24_sync_log")
        .update({
          status: "error",
          error_message: error.message || String(error),
          completed_at: new Date().toISOString(),
        })
        .eq("id", syncId);
    }

    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
