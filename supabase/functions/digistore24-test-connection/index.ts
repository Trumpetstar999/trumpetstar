import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  const apiKey = Deno.env.get("DIGISTORE24_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ valid: false, message: "Kein API-Key konfiguriert" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = `https://www.digistore24.com/api/v1/listProducts?token=${encodeURIComponent(apiKey)}&items_per_page=1`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.result === "success" || json.retval) {
      return new Response(JSON.stringify({
        valid: true,
        message: "Verbindung erfolgreich",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({
        valid: false,
        message: json.message || "Unbekannter Fehler",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({
      valid: false,
      message: error.message || "Verbindungsfehler",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
