import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(to: string, subject: string, html: string) {
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");
  if (!smtpPassword) {
    console.warn("[capture-lead] SMTP_PASSWORD not set, skipping email");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.world4you.com",
    port: 587,
    secure: false,
    auth: {
      user: "Valentin@trumpetstar.com",
      pass: smtpPassword,
    },
  });

  const info = await transporter.sendMail({
    from: '"Trumpetstar" <Valentin@trumpetstar.com>',
    to,
    subject,
    html,
  });

  console.log("[capture-lead] Email sent:", info.messageId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, first_name, segment, language, source, utm_source, utm_medium, utm_campaign, utm_content } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitize = (val: unknown): string | null =>
      typeof val === "string" ? val.slice(0, 255).trim() : null;

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = sanitize(first_name) ?? "";
    const cleanSegment = sanitize(segment) ?? "adult";
    const lang = ["de", "en", "es"].includes(language) ? language : "de";

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1) Check if auth user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    let authUserId: string | null = null;
    let isNewUser = false;

    if (existingUser) {
      authUserId = existingUser.id;
      console.log("User already exists:", authUserId);
    } else {
      // 2) Create auth user with random password (login via magic link only)
      const randomPassword = crypto.randomUUID() + "!Aa1";
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          display_name: cleanName,
          segment: cleanSegment,
        },
      });

      if (createError) {
        console.error("Create user error:", createError);
        return new Response(JSON.stringify({ error: "Failed to create account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      authUserId = newUser.user.id;
      isNewUser = true;
      console.log("New user created:", authUserId);

      // 3) Update profile with display_name and teacher flag
      await supabase.from("profiles").upsert({
        id: authUserId,
        display_name: cleanName || null,
        is_teacher: cleanSegment === "teacher",
      }, { onConflict: "id" });
    }

    // 4) Save lead
    const { error: leadError } = await supabase.from("leads").upsert(
      {
        email: cleanEmail,
        first_name: cleanName,
        segment: cleanSegment,
        language: lang,
        source: sanitize(source) ?? "landing",
        utm_source: sanitize(utm_source),
        utm_medium: sanitize(utm_medium),
        utm_campaign: sanitize(utm_campaign),
        utm_content: sanitize(utm_content),
        auth_user_id: authUserId,
      },
      { onConflict: "email", ignoreDuplicates: false }
    );

    if (leadError) {
      console.error("Lead capture error:", leadError);
    }

    // 5) Send magic link email via SMTP
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: cleanEmail,
        options: {
          redirectTo: `https://trumpetstar.lovable.app/app`,
        },
      });

      if (linkError) {
        console.error("generateLink error:", linkError);
      } else {
        const magicLink = linkData?.properties?.action_link;

        if (magicLink) {
          // Fetch email template from DB
          const { data: template } = await supabase
            .from("email_templates")
            .select("*")
            .eq("template_key", "welcome_lead")
            .maybeSingle();

          let subject: string;
          let htmlBody: string;

          if (template) {
            const subjectKey = `subject_${lang}` as keyof typeof template;
            const bodyKey = `body_html_${lang}` as keyof typeof template;
            subject = (template[subjectKey] as string) || template.subject_de;
            htmlBody = ((template[bodyKey] as string) || template.body_html_de)
              .replace(/\{\{magic_link\}\}/g, magicLink)
              .replace(/\{\{first_name\}\}/g, cleanName || "");
          } else {
            const fallback: Record<string, { subject: string; body: string }> = {
              de: {
                subject: "Willkommen bei TrumpetStar! 🎺",
                body: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
                    <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">Hallo${cleanName ? ` ${cleanName}` : ""}! 🎺</h1>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">Schön, dass du dabei bist! Dein TrumpetStar-Account ist bereit.</p>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">Klicke auf den Button, um dich einzuloggen und deine erste Lektion zu starten:</p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${magicLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b, #eab308); color: #1e293b; font-weight: 700; font-size: 16px; text-decoration: none; border-radius: 12px;">Jetzt einloggen & loslegen</a>
                    </div>
                    <p style="color: #94a3b8; font-size: 13px;">Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>
                  </div>
                `,
              },
              en: {
                subject: "Welcome to TrumpetStar! 🎺",
                body: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
                    <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">Hello${cleanName ? ` ${cleanName}` : ""}! 🎺</h1>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">Welcome! Your TrumpetStar account is ready.</p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${magicLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b, #eab308); color: #1e293b; font-weight: 700; font-size: 16px; text-decoration: none; border-radius: 12px;">Log in & get started</a>
                    </div>
                    <p style="color: #94a3b8; font-size: 13px;">If you didn't sign up, you can ignore this email.</p>
                  </div>
                `,
              },
              es: {
                subject: "¡Bienvenido a TrumpetStar! 🎺",
                body: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
                    <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">¡Hola${cleanName ? ` ${cleanName}` : ""}! 🎺</h1>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">¡Tu cuenta de TrumpetStar está lista!</p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${magicLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b, #eab308); color: #1e293b; font-weight: 700; font-size: 16px; text-decoration: none; border-radius: 12px;">Iniciar sesión</a>
                    </div>
                    <p style="color: #94a3b8; font-size: 13px;">Si no te registraste, puedes ignorar este correo.</p>
                  </div>
                `,
              },
            };
            subject = fallback[lang]?.subject || fallback.de.subject;
            htmlBody = fallback[lang]?.body || fallback.de.body;
          }

          await sendEmail(cleanEmail, subject, htmlBody);
        }
      }
    } catch (emailErr) {
      console.error("[capture-lead] Email error (non-fatal):", emailErr);
    }

    // 6) Push new lead to ClawBot Command (receive-sync)
    if (isNewUser) {
      try {
        const syncSecret = Deno.env.get("SYNC_SECRET");
        const syncTargetUrl = Deno.env.get("SYNC_TARGET_URL");
        if (syncSecret && syncTargetUrl) {
          const syncRes = await fetch(syncTargetUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-sync-secret": syncSecret,
            },
            body: JSON.stringify({
              event: "NEW_LEAD",
              user_email: cleanEmail,
              first_name: cleanName,
              segment: cleanSegment,
              language: lang,
              source: sanitize(source) ?? "landing",
              synced_at: new Date().toISOString(),
            }),
          });
          const syncText = await syncRes.text();
          if (!syncRes.ok) {
            console.warn("[capture-lead] push-sync to ClawBot failed:", syncRes.status, syncText);
          } else {
            console.log("[capture-lead] push-sync to ClawBot OK:", syncText);
          }
        }
      } catch (syncErr) {
        console.warn("[capture-lead] push-sync error (non-fatal):", syncErr);
      }

      // 7) Fire-and-forget POST to Google Sheets webhook
      try {
        const googleSheetUrl = Deno.env.get("GOOGLE_SHEET_WEBHOOK_URL");
        if (googleSheetUrl) {
          fetch(googleSheetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: cleanEmail,
              first_name: cleanName,
              last_name: "",
              segment: cleanSegment,
              source: "trumpetstar-app",
              language: lang,
              created_at: new Date().toISOString(),
            }),
          }).then(async (r) => {
            const t = await r.text();
            if (!r.ok) console.warn("[capture-lead] Google Sheet webhook failed:", r.status, t);
            else console.log("[capture-lead] Google Sheet webhook OK:", t);
          }).catch((e) => console.warn("[capture-lead] Google Sheet webhook error (non-fatal):", e));
        }
      } catch (gsErr) {
        console.warn("[capture-lead] Google Sheet webhook error (non-fatal):", gsErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        is_new_user: isNewUser,
        duplicate: !isNewUser,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
