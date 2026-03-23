import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_PROXY_URL = "http://72.60.17.112/email-proxy/send";
const BCC_ADDRESS = "valentin@trumpetstar.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EMAIL_PROXY_SECRET = Deno.env.get("EMAIL_PROXY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!EMAIL_PROXY_SECRET) throw new Error("EMAIL_PROXY_SECRET not set");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SRK, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authErr } = await createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    }).auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin-only: verify caller has admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invoice_id, recipient_email, invoice_html } = await req.json();
    if (!invoice_id || !recipient_email || !invoice_html) {
      return new Response(JSON.stringify({ error: "invoice_id, recipient_email, invoice_html required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invoice number for subject
    const { data: inv } = await supabase
      .from("invoices")
      .select("invoice_number, customer:customers(name, company_name)")
      .eq("id", invoice_id)
      .single();

    const invoiceNumber = inv?.invoice_number ?? invoice_id;
    const customerName = (inv?.customer as any)?.company_name || (inv?.customer as any)?.name || "";
    const subject = `Ihre Rechnung ${invoiceNumber} von Trumpetstar GmbH`;

    // Wrap invoice HTML in a clean email body
    const emailHtml = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">
  <div style="max-width:680px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:#2c3e50;padding:20px 28px;">
      <p style="margin:0;color:#fff;font-size:14px;">Trumpetstar GmbH</p>
    </div>
    <div style="padding:24px 28px;">
      <p style="font-size:15px;color:#1a1a1a;margin-bottom:8px;">Sehr geehrte Damen und Herren${customerName ? `, ${customerName}` : ''},</p>
      <p style="font-size:14px;color:#444;line-height:1.6;margin-bottom:20px;">
        anbei erhalten Sie Ihre Rechnung <strong>${invoiceNumber}</strong> von Trumpetstar GmbH.<br>
        Bitte überweisen Sie den fälligen Betrag bis zum angegebenen Fälligkeitsdatum.<br>
        Bei Fragen stehen wir Ihnen gerne zur Verfügung.
      </p>
    </div>
    <div style="border-top:1px solid #eee;padding:20px 28px 0;">
      ${invoice_html}
    </div>
    <div style="padding:20px 28px;background:#f9f9f9;border-top:1px solid #eee;">
      <p style="margin:0;font-size:11px;color:#888;">
        Trumpetstar GmbH &bull; Mogersdorf 253 &bull; 8382 Mogersdorf &bull;
        <a href="mailto:info@trumpetstar.com" style="color:#888;">info@trumpetstar.com</a> &bull;
        <a href="https://www.trumpetstar.com" style="color:#888;">www.trumpetstar.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const proxyPayload = {
      from: `"Valentin von Trumpetstar" <Valentin@trumpetstar.com>`,
      to: recipient_email,
      bcc: BCC_ADDRESS,
      subject,
      html: emailHtml,
      text: `Sehr geehrte Damen und Herren, anbei Ihre Rechnung ${invoiceNumber}. Bei Fragen: info@trumpetstar.com`,
      replyTo: "Valentin@trumpetstar.com",
    };

    const proxyRes = await fetch(EMAIL_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-proxy-secret": EMAIL_PROXY_SECRET,
      },
      body: JSON.stringify(proxyPayload),
    });

    if (!proxyRes.ok) {
      const errText = await proxyRes.text();
      throw new Error(`Proxy error ${proxyRes.status}: ${errText}`);
    }

    const proxyData = await proxyRes.json().catch(() => ({}));
    console.log("[send-invoice-email] Sent to:", recipient_email, "BCC:", BCC_ADDRESS, "Invoice:", invoiceNumber);

    return new Response(
      JSON.stringify({ success: true, messageId: proxyData.messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-invoice-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
