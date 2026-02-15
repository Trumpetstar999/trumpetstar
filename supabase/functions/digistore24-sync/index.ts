import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DS24_API_BASE = "https://www.digistore24.com/api/call";

async function ds24Get(apiKey: string, endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${DS24_API_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "X-DS-API-KEY": apiKey, Accept: "application/json" },
  });
  const json = await res.json();
  if (json.result !== "success") {
    throw new Error(`DS24 ${endpoint}: ${json.message || JSON.stringify(json)}`);
  }
  return json;
}

async function fetchAllPurchases(apiKey: string): Promise<any[]> {
  const allItems: any[] = [];
  let pageNo = 1;

  while (true) {
    console.log(`Fetching purchases page ${pageNo}...`);
    const json = await ds24Get(apiKey, "listPurchases", {
      page: String(pageNo),
      items_per_page: "500",
      from: "2015-01-01",
    });

    const data = json.data || {};
    const items = data.purchase_list || data.items || [];
    const arr = Array.isArray(items) ? items : Object.values(items);
    if (arr.length === 0) break;
    allItems.push(...arr);

    const totalPages = data.page_count || 1;
    if (pageNo >= totalPages) break;
    pageNo++;
  }

  return allItems;
}

async function fetchAllBuyers(apiKey: string): Promise<any[]> {
  const allItems: any[] = [];
  let pageNo = 1;

  while (true) {
    console.log(`Fetching buyers page ${pageNo}...`);
    const json = await ds24Get(apiKey, "listBuyers", {
      page: String(pageNo),
      items_per_page: "100",
    });

    const data = json.data || {};
    const items = data.buyers || data.items || data.buyer_list || [];
    const arr = Array.isArray(items) ? items : Object.values(items);
    if (arr.length === 0) break;
    allItems.push(...arr);

    const totalPages = data.page_count || data.total_pages || 1;
    if (pageNo >= totalPages) break;
    pageNo++;
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
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
    // 1. Fetch buyers
    console.log("Fetching buyers from DS24...");
    const buyers = await fetchAllBuyers(apiKey);
    console.log(`Fetched ${buyers.length} buyers`);

    // 2. Fetch purchases (all time)
    console.log("Fetching purchases from DS24...");
    const purchases = await fetchAllPurchases(apiKey);
    console.log(`Fetched ${purchases.length} purchases`);

    // 3. Build customer map from buyers first
    const customerMap = new Map<string, any>();

    for (const b of buyers) {
      const email = (b.email || "").toLowerCase().trim();
      if (!email) continue;
      customerMap.set(email, {
        email,
        digistore_customer_id: b.id || b.buyer_id || null,
        first_name: b.first_name || b.name || "",
        last_name: b.last_name || "",
        company: b.company || null,
        country: b.country || null,
        phone: b.phone || null,
        total_purchases: 0,
        total_revenue: 0,
        first_purchase_at: null as string | null,
        last_purchase_at: null as string | null,
      });
    }

    // 4. Enrich with purchase data
    for (const p of purchases) {
      const email = (
        p.buyer_email || p.email || p.address_email || ""
      ).toLowerCase().trim();
      if (!email) continue;

      if (!customerMap.has(email)) {
        customerMap.set(email, {
          email,
          digistore_customer_id: p.buyer_id || p.customer_id || null,
          first_name: p.buyer_first_name || p.address_first_name || "",
          last_name: p.buyer_last_name || p.address_last_name || "",
          company: p.buyer_company || p.address_company || null,
          country: p.buyer_country || p.address_country || null,
          phone: p.buyer_phone || null,
          total_purchases: 0,
          total_revenue: 0,
          first_purchase_at: null,
          last_purchase_at: null,
        });
      }

      const c = customerMap.get(email)!;
      const amount = parseFloat(p.billing_amount || p.amount || p.earned_amount || "0") || 0;
      const payDate = p.pay_date || p.purchase_date || p.created_at || null;

      const status = (p.billing_status || p.transaction_status || p.status || "").toLowerCase();
      if (!status || status === "completed" || status === "paid" || status === "approved") {
        c.total_purchases++;
        c.total_revenue += amount;
      }

      if (payDate) {
        if (!c.first_purchase_at || payDate < c.first_purchase_at) c.first_purchase_at = payDate;
        if (!c.last_purchase_at || payDate > c.last_purchase_at) c.last_purchase_at = payDate;
      }
    }

    // 5. Batch upsert customers
    const customerRows = Array.from(customerMap.values()).map(c => ({
      ...c,
      first_purchase_at: c.first_purchase_at ? new Date(c.first_purchase_at).toISOString() : null,
      last_purchase_at: c.last_purchase_at ? new Date(c.last_purchase_at).toISOString() : null,
    }));

    let customersImported = 0;
    const BATCH = 50;
    for (let i = 0; i < customerRows.length; i += BATCH) {
      const batch = customerRows.slice(i, i + BATCH);
      const { data, error } = await supabase
        .from("digistore24_customers")
        .upsert(batch, { onConflict: "email", ignoreDuplicates: false })
        .select("id");
      if (error) console.error("Customer upsert error:", error.message);
      customersImported += (data?.length || 0);
    }
    console.log(`Upserted ${customersImported} customers`);

    // 6. Build email->id lookup
    const { data: allCusts } = await supabase
      .from("digistore24_customers")
      .select("id, email");
    const emailToId = new Map<string, string>();
    for (const c of (allCusts || [])) emailToId.set(c.email, c.id);

    // 7. Batch upsert transactions
    let txImported = 0;
    const txRows: any[] = [];
    for (const p of purchases) {
      const email = (p.buyer_email || p.email || p.address_email || "").toLowerCase().trim();
      const transactionId = p.purchase_id || p.order_id || p.transaction_id || p.id;
      if (!transactionId) continue;

      txRows.push({
        digistore_transaction_id: String(transactionId),
        customer_id: email ? (emailToId.get(email) || null) : null,
        product_id: p.product_id ? String(p.product_id) : null,
        product_name: p.product_name || p.product_title || null,
        amount: parseFloat(p.billing_amount || p.amount || p.earned_amount || "0") || 0,
        currency: p.currency || "EUR",
        status: p.billing_status || p.transaction_status || p.status || "completed",
        payment_method: p.payment_method || p.pay_method || null,
        pay_date: (p.pay_date || p.purchase_date) ? new Date(p.pay_date || p.purchase_date).toISOString() : null,
        refund_date: p.refund_date ? new Date(p.refund_date).toISOString() : null,
        raw_data: p,
      });
    }

    for (let i = 0; i < txRows.length; i += BATCH) {
      const batch = txRows.slice(i, i + BATCH);
      const { data, error } = await supabase
        .from("digistore24_transactions")
        .upsert(batch, { onConflict: "digistore_transaction_id", ignoreDuplicates: false })
        .select("id");
      if (error) console.error("Transaction upsert error:", error.message);
      txImported += (data?.length || 0);
    }
    console.log(`Upserted ${txImported} transactions`);

    const totalImported = customersImported + txImported;

    if (syncId) {
      await supabase.from("digistore24_sync_log").update({
        status: "success",
        records_imported: totalImported,
        records_updated: 0,
        completed_at: new Date().toISOString(),
      }).eq("id", syncId);
    }

    return new Response(JSON.stringify({
      success: true,
      customers: { imported: customersImported, updated: 0 },
      transactions: { imported: txImported, updated: 0 },
      total: { imported: totalImported, updated: 0 },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Sync error:", error);
    if (syncId) {
      await supabase.from("digistore24_sync_log").update({
        status: "error",
        error_message: error.message || String(error),
        completed_at: new Date().toISOString(),
      }).eq("id", syncId);
    }
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
