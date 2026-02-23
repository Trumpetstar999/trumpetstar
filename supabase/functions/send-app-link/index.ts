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

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    // Get auth token to identify user
    const authHeader = req.headers.get("Authorization");
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    const { email, locale } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting: max 3 emails per day per user
    if (userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count } = await supabaseAdmin
        .from("activity_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action", "send_app_link")
        .gte("created_at", today.toISOString());

      if ((count || 0) >= 3) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Max 3 emails per day." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const lang = ["de", "en", "es"].includes(locale) ? locale : "de";
    const appUrl = "https://trumpetstar.lovable.app";

    const subjects: Record<string, string> = {
      de: "Dein TrumpetStar-Link – am besten auf iPad/Tablet öffnen",
      en: "Your TrumpetStar Link – best on iPad/Tablet",
      es: "Tu enlace TrumpetStar – mejor en iPad/Tablet",
    };

    const bodies: Record<string, string> = {
      de: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1E86FF; margin-bottom: 16px;">🎺 TrumpetStar</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Hier ist dein Link zur TrumpetStar Lernplattform:</p>
          <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #1E86FF, #0F5EDB); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 16px 0;">Jetzt öffnen</a>
          <p style="font-size: 14px; color: #666; margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px;">💡 <strong>Tipp:</strong> Öffne diesen Link auf deinem iPad oder Tablet im Querformat für die beste Lernerfahrung.</p>
          <p style="font-size: 12px; color: #999; margin-top: 24px;">Trumpetstar GmbH · info@trumpetstar.com</p>
        </div>
      `,
      en: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1E86FF; margin-bottom: 16px;">🎺 TrumpetStar</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Here's your link to the TrumpetStar learning platform:</p>
          <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #1E86FF, #0F5EDB); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 16px 0;">Open now</a>
          <p style="font-size: 14px; color: #666; margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px;">💡 <strong>Tip:</strong> Open this link on your iPad or tablet in landscape mode for the best learning experience.</p>
          <p style="font-size: 12px; color: #999; margin-top: 24px;">Trumpetstar GmbH · info@trumpetstar.com</p>
        </div>
      `,
      es: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1E86FF; margin-bottom: 16px;">🎺 TrumpetStar</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Aquí tienes tu enlace a la plataforma de aprendizaje TrumpetStar:</p>
          <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #1E86FF, #0F5EDB); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 16px 0;">Abrir ahora</a>
          <p style="font-size: 14px; color: #666; margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px;">💡 <strong>Consejo:</strong> Abre este enlace en tu iPad o tablet en horizontal para la mejor experiencia.</p>
          <p style="font-size: 12px; color: #999; margin-top: 24px;">Trumpetstar GmbH · info@trumpetstar.com</p>
        </div>
      `,
    };

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Trumpetstar <noreply@trumpetstar.app>",
        to: [email.trim().toLowerCase()],
        subject: subjects[lang],
        html: bodies[lang],
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log activity for rate limiting
    if (userId) {
      await supabaseAdmin.from("activity_logs").insert({
        user_id: userId,
        action: "send_app_link",
        metadata: { email: email.trim().toLowerCase() },
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-app-link error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
