import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

export interface GrantInput {
  email: string;
  product_id: string;
  first_name?: string | null;
  last_name?: string | null;
  order_id?: string | null;
  amount?: number | null;
  currency?: string | null;
  send_email?: boolean;
}

interface GrantResult {
  email: string;
  status: "granted" | "skipped" | "error";
  plan_key?: string;
  created_user?: boolean;
  email_sent?: boolean;
  message?: string;
}

async function findUserByEmail(email: string) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
  );
  if (!res.ok) {
    throw new Error(`user lookup failed [${res.status}]: ${await res.text()}`);
  }
  const body = await res.json();
  return body?.users?.[0] ?? null;
}

export async function sendWelcomeMail(
  admin: any,
  params: { email: string; firstName: string; locale: string; appBaseUrl: string; productName: string },
): Promise<void> {
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

  // 1) Preferred: house SMTP relay via send-email
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: email,
        subject: t.subject,
        html,
        recipient_name: firstName || null,
      }),
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

/** Creates the account (if needed), sets the plan, writes entitlement + customer and sends the welcome mail. */
export async function grantAccess(admin: any, input: GrantInput): Promise<GrantResult> {
  const email = (input.email || "").toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return { email: input.email, status: "error", message: "invalid email" };
  }
  const productId = String(input.product_id || "").trim();
  if (!productId) return { email, status: "error", message: "missing product_id" };

  const { data: product } = await admin
    .from("digistore24_products")
    .select("*")
    .eq("digistore_product_id", productId)
    .maybeSingle();

  if (!product) {
    return { email, status: "error", message: `unknown_product: ${productId}` };
  }

  const appBaseUrl =
    (await admin.from("digistore24_settings").select("value").eq("key", "app_base_url").maybeSingle())
      .data?.value || "https://www.trumpetstar.app";
  const defaultLocale =
    (await admin.from("digistore24_settings").select("value").eq("key", "default_locale").maybeSingle())
      .data?.value || "de";

  // 1. User
  let user = await findUserByEmail(email);
  let createdUser = false;
  if (!user) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        first_name: input.first_name || "",
        last_name: input.last_name || "",
        display_name:
          `${input.first_name || ""} ${input.last_name || ""}`.trim() || email.split("@")[0],
      },
    });
    if (createError) return { email, status: "error", message: createError.message };
    user = created.user;
    createdUser = true;
    await admin
      .from("user_preferences")
      .upsert({ user_id: user.id, language: defaultLocale }, { onConflict: "user_id" });
  }
  const userId = user.id as string;

  let locale = defaultLocale;
  const { data: prefs } = await admin
    .from("user_preferences")
    .select("language")
    .eq("user_id", userId)
    .maybeSingle();
  if (prefs?.language) locale = prefs.language;

  // 2. Subscription record
  const orderId = input.order_id || `MANUAL_${productId}_${Date.now()}`;
  const { data: subscription } = await admin
    .from("digistore24_subscriptions")
    .upsert(
      {
        user_id: userId,
        digistore_order_id: orderId,
        digistore_product_id: productId,
        status: "active",
        cancel_at_period_end: false,
      },
      { onConflict: "digistore_order_id" },
    )
    .select()
    .maybeSingle();

  // 3. Entitlement
  const { data: existingEnt } = await admin
    .from("digistore24_entitlements")
    .select("active")
    .eq("user_id", userId)
    .eq("entitlement_key", product.entitlement_key)
    .eq("source", "digistore24")
    .maybeSingle();
  const wasActive = existingEnt?.active === true;

  await admin.from("digistore24_entitlements").upsert(
    {
      user_id: userId,
      entitlement_key: product.entitlement_key,
      source: "digistore24",
      subscription_id: subscription?.id ?? null,
      active: true,
      valid_until: null,
    },
    { onConflict: "user_id,entitlement_key,source" },
  );

  // 4. Membership plan
  if (product.plan_key && product.plan_key !== "FREE") {
    const { data: plan } = await admin.from("plans").select("rank").eq("key", product.plan_key).maybeSingle();
    const { data: currentMembership } = await admin
      .from("user_memberships")
      .select("plan_rank, active_product_ids")
      .eq("user_id", userId)
      .maybeSingle();

    const newRank = plan?.rank ?? 0;
    const keepHigher = (currentMembership?.plan_rank ?? 0) > newRank;
    const productIds = new Set<string>([...(currentMembership?.active_product_ids ?? []), productId]);

    if (!keepHigher) {
      await admin.from("user_memberships").upsert(
        {
          user_id: userId,
          plan_key: product.plan_key,
          current_plan: product.plan_key,
          plan_rank: newRank,
          active_product_ids: Array.from(productIds),
        },
        { onConflict: "user_id" },
      );
    } else {
      await admin
        .from("user_memberships")
        .update({ active_product_ids: Array.from(productIds) })
        .eq("user_id", userId);
    }
  }

  // 5. Customer record
  const { data: existingCust } = await admin
    .from("digistore24_customers")
    .select("id, total_purchases, total_revenue")
    .eq("email", email)
    .maybeSingle();

  if (existingCust) {
    await admin
      .from("digistore24_customers")
      .update({
        first_name: input.first_name || null,
        last_name: input.last_name || null,
        last_purchase_at: new Date().toISOString(),
      })
      .eq("id", existingCust.id);
  } else {
    await admin.from("digistore24_customers").insert({
      email,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      total_purchases: 1,
      total_revenue: input.amount || 0,
      first_purchase_at: new Date().toISOString(),
      last_purchase_at: new Date().toISOString(),
    });
  }

  // 6. Welcome mail
  let emailSent = false;
  const shouldSend = input.send_email !== false && (createdUser || !wasActive);
  if (shouldSend) {
    try {
      await sendWelcomeMail(admin, {
        email,
        firstName: input.first_name || "",
        locale,
        appBaseUrl,
        productName: product.name,
      });
      emailSent = true;
    } catch (e: any) {
      console.error("[grant-access] welcome mail failed:", e?.message || e);
    }
  }

  return {
    email,
    status: "granted",
    plan_key: product.plan_key,
    created_user: createdUser,
    email_sent: emailSent,
    message: shouldSend && !emailSent ? "Zugang erstellt, E-Mail-Versand fehlgeschlagen" : undefined,
  };
}

async function fetchDigistorePurchases(since: string): Promise<any[]> {
  const apiKey = Deno.env.get("DIGISTORE24_API_KEY");
  if (!apiKey) throw new Error("DIGISTORE24_API_KEY not configured");

  const to = new Date().toISOString().slice(0, 10);
  const url = `https://www.digistore24.com/api/call/listPurchases?from=${since}&to=${to}`;
  const res = await fetch(url, { headers: { "X-DS-API-KEY": apiKey, Accept: "application/json" } });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`Digistore24 API error [${res.status}]: ${bodyText}`);

  let body: any;
  try {
    body = JSON.parse(bodyText);
  } catch {
    throw new Error(`Digistore24 API returned non-JSON: ${bodyText.slice(0, 300)}`);
  }
  if (body.result !== "success") {
    throw new Error(body.message || `Digistore24 API result: ${body.result}`);
  }

  const data = body.data || {};
  let list: any[] = [];
  if (Array.isArray(data.purchase_list)) list = data.purchase_list;
  else if (Array.isArray(data.purchases)) list = data.purchases;
  else if (Array.isArray(data)) list = data;
  else {
    const firstArray = Object.values(data).find((v) => Array.isArray(v));
    list = (firstArray as any[]) || [];
  }
  return list;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    // Admin auth
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "").trim();

    let callerId: string | null = null;
    if (token === SERVICE_ROLE_KEY) {
      callerId = "service_role";
    } else {
      const userClient = createClient(SUPABASE_URL, ANON_KEY);
      const { data: userData, error: userError } = await userClient.auth.getUser(token);
      if (userError || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin");
      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      callerId = userData.user.id;
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "grant";

    if (action === "grant") {
      const result = await grantAccess(admin, body as GrantInput);
      return new Response(JSON.stringify({ success: result.status === "granted", result }), {
        status: result.status === "granted" ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "backfill") {
      const since: string = body.since || new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10);
      const dryRun = body.dry_run === true;

      const purchases = await fetchDigistorePurchases(since);
      const results: GrantResult[] = [];

      for (const p of purchases) {
        const email = (p.email || p.buyer_email || p.buyer?.email || "").toLowerCase().trim();
        const productId = String(p.product_id || p.product?.id || p.productId || "");
        const payStatus = String(p.pay_status || p.payment_status || p.billing_status || "").toLowerCase();
        const isRevoked = ["refunded", "chargeback", "cancelled", "canceled"].some((s) => payStatus.includes(s));

        if (!email || !productId || isRevoked) {
          results.push({ email: email || "?", status: "skipped", message: payStatus || "missing data" });
          continue;
        }
        if (dryRun) {
          results.push({ email, status: "skipped", message: "dry run" });
          continue;
        }

        try {
          const r = await grantAccess(admin, {
            email,
            product_id: productId,
            first_name: p.first_name || p.buyer?.first_name || null,
            last_name: p.last_name || p.buyer?.last_name || null,
            order_id: p.order_id || p.id || null,
            amount: p.amount ? parseFloat(p.amount) : null,
            currency: p.currency || "EUR",
            send_email: body.send_email !== false,
          });
          results.push(r);
        } catch (e: any) {
          results.push({ email, status: "error", message: e?.message || String(e) });
        }
      }

      const granted = results.filter((r) => r.status === "granted").length;
      const skipped = results.filter((r) => r.status === "skipped").length;
      const errors = results.filter((r) => r.status === "error").length;

      await admin.from("digistore24_import_logs").insert({
        triggered_by: callerId === "service_role" ? null : callerId,
        status: errors > 0 ? "error" : "success",
        finished_at: new Date().toISOString(),
        products_total: purchases.length,
        products_created: granted,
        products_updated: skipped,
        error_message: errors > 0 ? results.filter((r) => r.status === "error").slice(0, 5).map((r) => `${r.email}: ${r.message}`).join(" | ") : null,
      });

      return new Response(
        JSON.stringify({ success: true, total: purchases.length, granted, skipped, errors, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: `unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[grant-access] error:", err?.message || err);
    return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
