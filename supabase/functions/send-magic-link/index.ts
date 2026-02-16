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

    const { email, locale, redirectTo } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine language: default to 'de'
    const lang = ["de", "en", "es"].includes(locale) ? locale : "de";

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate magic link token
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: redirectTo || SUPABASE_URL,
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
      // Fallback templates
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
        subject,
        html: htmlBody,
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

    return new Response(
      JSON.stringify({ success: true, messageId: resendData.id }),
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
