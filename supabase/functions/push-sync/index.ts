import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * push-sync: Internal edge function called by App A to forward events to App B.
 * Reads SYNC_SECRET and SYNC_TARGET_URL from env, forwards the payload with the shared secret header.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const syncSecret = Deno.env.get("SYNC_SECRET");
  const syncTargetUrl = Deno.env.get("SYNC_TARGET_URL");

  if (!syncSecret || !syncTargetUrl) {
    console.error("[push-sync] Missing SYNC_SECRET or SYNC_TARGET_URL");
    return new Response(JSON.stringify({ error: "sync_not_configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Enrich with server timestamp
  payload.synced_at = new Date().toISOString();

  try {
    const response = await fetch(syncTargetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": syncSecret,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`[push-sync] App B returned ${response.status}: ${responseText}`);
      return new Response(
        JSON.stringify({ error: "app_b_error", status: response.status, detail: responseText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[push-sync] Successfully pushed event "${payload.event}" to App B`);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[push-sync] Fetch to App B failed:", msg);
    return new Response(JSON.stringify({ error: "fetch_failed", detail: msg }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
