import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_PROXY_URL = "http://72.60.17.112/email-proxy/send";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EMAIL_PROXY_SECRET = Deno.env.get("EMAIL_PROXY_SECRET");
    if (!EMAIL_PROXY_SECRET) throw new Error("EMAIL_PROXY_SECRET is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const { email, locale, redirectTo } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = ["de", "en", "es"].includes(locale) ? locale : "de";

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate magic link token
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: redirectTo || "https://trumpetstar.lovable.app/app",
      },
    });

    if (linkError) {
      console.error("generateLink error:", linkError);
      return new Response(
        JSON.stringify({ error: linkError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const magicLink = data.properties?.action_link;
    if (!magicLink) {
      throw new Error("No action_link returned from generateLink");
    }

    // Fetch email template from DB
    const { data: template, error: tplError } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("template_key", "magic_link")
      .maybeSingle();

    if (tplError) {
      console.error("Template fetch error:", tplError);
    }

    let subject: string;
    let htmlBody: string;

    if (template) {
      const subjectKey = `subject_${lang}` as keyof typeof template;
      const bodyKey = `body_html_${lang}` as keyof typeof template;
      subject = (template[subjectKey] as string) || template.subject_de;
      htmlBody = ((template[bodyKey] as string) || template.body_html_de).replace(
        /\{\{magic_link\}\}/g,
        magicLink
      );
    } else {
      const fallback: Record<string, { subject: string; body: string }> = {
        de: {
          subject: "Dein Login-Link für Trumpetstar",
          body: `<p>Klicke <a href="${magicLink}">hier</a> um dich einzuloggen.</p>`,
        },
        en: {
          subject: "Your Login Link for Trumpetstar",
          body: `<p>Click <a href="${magicLink}">here</a> to log in.</p>`,
        },
        es: {
          subject: "Tu enlace de inicio de sesión para Trumpetstar",
          body: `<p>Haz clic <a href="${magicLink}">aquí</a> para iniciar sesión.</p>`,
        },
      };
      subject = fallback[lang].subject;
      htmlBody = fallback[lang].body;
    }

    // Send via HTTP proxy
    const proxyRes = await fetch(EMAIL_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-proxy-secret": EMAIL_PROXY_SECRET,
      },
      body: JSON.stringify({
        from: '"Trumpetstar" <Valentin@trumpetstar.com>',
        to: email.trim().toLowerCase(),
        subject,
        html: htmlBody,
        replyTo: "Valentin@trumpetstar.com",
      }),
    });

    if (!proxyRes.ok) {
      const errText = await proxyRes.text();
      throw new Error(`Proxy error ${proxyRes.status}: ${errText}`);
    }

    const proxyData = await proxyRes.json().catch(() => ({}));
    const messageId = proxyData.messageId || proxyData.message_id || "proxy-sent";
    console.log("[send-magic-link] Sent via proxy:", messageId);

    return new Response(
      JSON.stringify({ success: true, messageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-magic-link error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
