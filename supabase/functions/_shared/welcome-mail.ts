const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface WelcomeMailParams {
  email: string;
  firstName: string;
  locale: string;
  appBaseUrl: string;
  productName: string;
}

/**
 * Sends the purchase welcome mail with a magic login link.
 * Primary channel: the house SMTP relay (send-email). Resend is only used as a fallback.
 */
export async function sendWelcomeMail(admin: any, params: WelcomeMailParams): Promise<void> {
  const { email, firstName, locale, appBaseUrl, productName } = params;

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${appBaseUrl}/app` },
  });
  if (linkError) throw linkError;
  const magicLink = linkData.properties.action_link;

  const texts: Record<string, { subject: string; hello: string; intro: string; cta: string; note: string }> = {
    de: {
      subject: `🎺 Dein Zugang zu ${productName} ist freigeschaltet!`,
      hello: `Hallo ${firstName || "Trompeter"}!`,
      intro: `Vielen Dank für deinen Kauf! Dein Zugang zu <strong>${productName}</strong> ist ab sofort freigeschaltet.`,
      cta: "Jetzt einloggen",
      note: "Der Link ist 24 Stunden gültig. Danach kannst du dich jederzeit mit deiner E-Mail-Adresse anmelden.",
    },
    en: {
      subject: `🎺 Your access to ${productName} is now active!`,
      hello: `Hello ${firstName || "Trumpeter"}!`,
      intro: `Thank you for your purchase! Your access to <strong>${productName}</strong> is now active.`,
      cta: "Log in now",
      note: "This link is valid for 24 hours. After that you can sign in any time with your email address.",
    },
    es: {
      subject: `🎺 ¡Tu acceso a ${productName} está activado!`,
      hello: `¡Hola ${firstName || "Trompetista"}!`,
      intro: `¡Gracias por tu compra! Tu acceso a <strong>${productName}</strong> ya está activado.`,
      cta: "Iniciar sesión",
      note: "Este enlace es válido por 24 horas. Después puedes iniciar sesión con tu correo electrónico.",
    },
    sl: {
      subject: `🎺 Tvoj dostop do ${productName} je aktiven!`,
      hello: `Zdravo ${firstName || "trobentač"}!`,
      intro: `Hvala za nakup! Tvoj dostop do <strong>${productName}</strong> je zdaj aktiven.`,
      cta: "Prijava",
      note: "Povezava velja 24 ur. Nato se lahko kadar koli prijaviš s svojim e-naslovom.",
    },
  };
  const t = texts[locale] || texts.de;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h1 style="color:#1e293b;">${t.hello} 🎺</h1>
      <p style="color:#475569;font-size:16px;line-height:1.6;">${t.intro}</p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${magicLink}" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;">${t.cta}</a>
      </div>
      <p style="color:#94a3b8;font-size:14px;">${t.note}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:30px 0;">
      <p style="color:#94a3b8;font-size:12px;">Trumpetstar | Deine Online-Trompetenschule</p>
    </div>`;

  // 1) House SMTP relay
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ to: email, subject: t.subject, html, recipient_name: firstName || null }),
    });
    if (res.ok) return;
    console.error(`[welcome-mail] send-email failed [${res.status}]: ${await res.text()}`);
  } catch (e) {
    console.error("[welcome-mail] send-email threw:", e);
  }

  // 2) Fallback: Resend
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("welcome mail failed and no RESEND_API_KEY fallback configured");
  const from = Deno.env.get("RESEND_FROM_EMAIL") || "Trumpetstar <noreply@trumpetstar.com>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [email], subject: t.subject, html }),
  });
  if (!res.ok) throw new Error(`Resend error [${res.status}]: ${await res.text()}`);
}
