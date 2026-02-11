import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res;
      if (i < retries) await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    } catch (e) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw new Error("Max retries exceeded");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const digiApiKey = Deno.env.get("DIGISTORE24_API_KEY");

    if (!digiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "DIGISTORE24_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create import log
    const { data: logEntry, error: logError } = await adminClient
      .from("digistore24_import_logs")
      .insert({ triggered_by: userId, status: "running" })
      .select("id")
      .single();

    if (logError) {
      console.error("Log insert error:", logError);
    }
    const logId = logEntry?.id;

    // Call Digistore24 API
    let products: any[] = [];
    try {
      const apiRes = await fetchWithRetry(
        "https://www.digistore24.com/api/call/listProducts",
        {
          method: "GET",
          headers: {
            "X-DS-API-KEY": digiApiKey,
            Accept: "application/json",
          },
        }
      );

      const body = await apiRes.json();

      if (body.result !== "success") {
        throw new Error(body.message || `API returned result: ${body.result}`);
      }

      // The API may return products in different structures
      if (body.data?.products) {
        products = Array.isArray(body.data.products)
          ? body.data.products
          : Object.values(body.data.products);
      } else if (body.data?.items) {
        products = Array.isArray(body.data.items)
          ? body.data.items
          : Object.values(body.data.items);
      } else if (Array.isArray(body.data)) {
        products = body.data;
      } else {
        // Try to extract any array from data
        const dataValues = Object.values(body.data || {});
        const firstArray = dataValues.find((v) => Array.isArray(v));
        products = (firstArray as any[]) || [];
      }
    } catch (apiErr: any) {
      // Update log with error
      if (logId) {
        await adminClient
          .from("digistore24_import_logs")
          .update({
            status: "error",
            finished_at: new Date().toISOString(),
            error_message: apiErr.message,
          })
          .eq("id", logId);
      }
      return new Response(
        JSON.stringify({ success: false, error: apiErr.message }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert products
    let created = 0;
    let updated = 0;
    const now = new Date().toISOString();

    for (const p of products) {
      const productId = String(p.id || p.product_id || p.Id);
      const productName = p.name || p.title || p.Name || `Product ${productId}`;
      const isActive = p.active !== false && p.is_active !== false;

      // Check if exists
      const { data: existing } = await adminClient
        .from("digistore24_products")
        .select("id")
        .eq("digistore_product_id", productId)
        .maybeSingle();

      if (existing) {
        // Update but preserve plan_key and checkout_url
        await adminClient
          .from("digistore24_products")
          .update({
            name: productName,
            is_active: isActive,
            raw_payload_json: p,
            updated_at: now,
            imported_at: now,
          })
          .eq("id", existing.id);
        updated++;
      } else {
        // Insert new with default plan
        await adminClient.from("digistore24_products").insert({
          digistore_product_id: productId,
          name: productName,
          entitlement_key: productId,
          is_active: isActive,
          raw_payload_json: p,
          plan_key: "FREE",
          imported_at: now,
        });
        created++;
      }
    }

    // Update log
    if (logId) {
      await adminClient
        .from("digistore24_import_logs")
        .update({
          status: "success",
          finished_at: new Date().toISOString(),
          products_total: products.length,
          products_created: created,
          products_updated: updated,
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: products.length,
        created,
        updated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Import error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
