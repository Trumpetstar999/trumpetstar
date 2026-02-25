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
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, first_name, segment, language, source, utm_source, utm_medium, utm_campaign, utm_content } = body;

    // Validate email
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
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@trumpetstar.app";

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

    // 5) Send magic link email
    if (RESEND_API_KEY) {
      try {
        // Generate magic link
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: cleanEmail,
          options: {
            redirectTo: `${SUPABASE_URL.replace('.supabase.co', '.lovable.app')}/app`,
          },
        });

        if (linkError) {
          console.error("generateLink error:", linkError);
        } else {
          const magicLink = linkData?.properties?.action_link;

          if (magicLink) {
            // Fetch email template
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
              // Fallback
              const fallback: Record<string, { subject: string; body: string }> = {
                de: {
                  subject: "Willkommen bei TrumpetStar! 🎺",
                  body: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
                      <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">Hallo${cleanName ? ` ${cleanName}` : ""}! 🎺</h1>
                      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                        Schön, dass du dabei bist! Dein TrumpetStar-Account ist bereit.
                      </p>
                      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                        Klicke auf den Button, um dich einzuloggen und deine erste Lektion zu starten:
                      </p>
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${magicLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b, #eab308); color: #1e293b; font-weight: 700; font-size: 16px; text-decoration: none; border-radius: 12px;">
                          Jetzt einloggen & loslegen
                        </a>
                      </div>
                      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                        Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.
                      </p>
                    </div>
                  `,
                },
                en: {
                  subject: "Welcome to TrumpetStar! 🎺",
                  body: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
                      <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">Hello${cleanName ? ` ${cleanName}` : ""}! 🎺</h1>
                      <p style="color: #475569; font-size: 16px; line-height: 1.6;">Welcome! Your TrumpetStar account is ready.</p>
                      <p style="color: #475569; font-size: 16px; line-height: 1.6;">Click the button below to log in and start your first lesson:</p>
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

            // Send via Resend
            const resendRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: `Trumpetstar <${RESEND_FROM_EMAIL}>`,
                to: [cleanEmail],
                subject,
                html: htmlBody,
              }),
            });

            const resendData = await resendRes.json();
            if (!resendRes.ok) {
              console.error("Resend error:", resendData);
            } else {
              console.log("Welcome email sent:", resendData.id);
            }
          }
        }
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
        // Don't fail the whole request if email fails
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
