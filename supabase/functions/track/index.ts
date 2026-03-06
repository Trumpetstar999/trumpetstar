// Email Tracking Function
// GET /track?type=open&id={email_log_id}   → updates opened_at, returns 1x1 GIF
// GET /track?type=click&id={email_log_id}&url={encoded_url} → updates clicked_at, redirects

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1x1 transparent GIF (base64)
const PIXEL_GIF = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");   // "open" or "click"
  const id   = url.searchParams.get("id");     // email_log UUID
  const dest = url.searchParams.get("url");    // target URL (for clicks)

  // Initialize Supabase with service role to bypass RLS
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  if (id && (type === "open" || type === "click")) {
    try {
      const updateData: Record<string, string> = {};
      if (type === "open")  updateData.opened_at  = new Date().toISOString();
      if (type === "click") updateData.clicked_at = new Date().toISOString();
      // Only update if not already set (don't overwrite first open/click timestamp)
      if (type === "open") {
        await supabase
          .from("email_log")
          .update({ opened_at: new Date().toISOString(), status: "opened" })
          .eq("id", id)
          .is("opened_at", null);
      }
      if (type === "click") {
        await supabase
          .from("email_log")
          .update({ clicked_at: new Date().toISOString() })
          .eq("id", id)
          .is("clicked_at", null);
      }
    } catch (e) {
      console.warn("[track] DB update failed:", e);
    }
  }

  // Open tracking → return transparent 1x1 GIF
  if (type === "open" || !type) {
    const gif = Uint8Array.from(atob(PIXEL_GIF), c => c.charCodeAt(0));
    return new Response(gif, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    });
  }

  // Click tracking → redirect to original URL
  if (type === "click" && dest) {
    try {
      const target = decodeURIComponent(dest);
      return new Response(null, {
        status: 302,
        headers: { "Location": target, ...corsHeaders },
      });
    } catch {
      return new Response("Bad URL", { status: 400 });
    }
  }

  return new Response("OK", { status: 200, headers: corsHeaders });
});
