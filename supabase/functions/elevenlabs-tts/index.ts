import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice IDs for different languages
const VOICE_IDS = {
  de: "onwK4e9ZLuTAKqWW03F9", // Daniel - German male voice
  en: "JBFqnCBsd6RMkjVDRZzb", // George - English male voice
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
  const serviceRoleKeyTts = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const isServiceRoleTts = serviceRoleKeyTts && callerToken === serviceRoleKeyTts;
  if (!isServiceRoleTts) {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const _sb = createClient(SUPABASE_URL_CHECK, SUPABASE_ANON_KEY_CHECK, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await _sb.auth.getUser(callerToken);
    if (authError || !authData?.user) {
      console.warn("[elevenlabs-tts] Unauthorized caller");
      return new Response(JSON.stringify({ error: "Unauthorized: invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const { text, language = "de" } = await req.json();

    if (!text) {
      throw new Error("Text is required");
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const voiceId = VOICE_IDS[language as keyof typeof VOICE_IDS] || VOICE_IDS.de;

    console.log("[elevenlabs-tts] Generating speech for language:", language, "voice:", voiceId);
    console.log("[elevenlabs-tts] Text length:", text.length);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[elevenlabs-tts] ElevenLabs error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log("[elevenlabs-tts] Audio generated, size:", audioBuffer.byteLength);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("[elevenlabs-tts] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
