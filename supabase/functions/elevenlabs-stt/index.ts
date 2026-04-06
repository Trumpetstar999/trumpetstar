import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── TS-QA-KW14-SEC-002: Caller Authentication ────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized: missing Bearer token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const callerToken = authHeader.replace("Bearer ", "").trim();
  const SUPABASE_URL_CHECK = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY_CHECK = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKeyStt = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const isServiceRoleStt = serviceRoleKeyStt && callerToken === serviceRoleKeyStt;
  if (!isServiceRoleStt) {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const _sb = createClient(SUPABASE_URL_CHECK, SUPABASE_ANON_KEY_CHECK, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await _sb.auth.getUser(callerToken);
    if (authError || !authData?.user) {
      console.warn("[elevenlabs-stt] Unauthorized caller");
      return new Response(JSON.stringify({ error: "Unauthorized: invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      throw new Error("Audio file is required");
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    console.log("[elevenlabs-stt] Processing audio file, size:", audioFile.size);

    const apiFormData = new FormData();
    apiFormData.append("file", audioFile);
    apiFormData.append("model_id", "scribe_v2");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[elevenlabs-stt] ElevenLabs error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const transcription = await response.json();
    console.log("[elevenlabs-stt] Transcription completed:", transcription.text?.substring(0, 100));

    return new Response(JSON.stringify(transcription), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[elevenlabs-stt] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
