import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRACK_BASE = `${Deno.env.get("SUPABASE_URL")}/functions/v1/track`;
const EMAIL_PROXY_URL = "http://72.60.17.112/email-proxy/send";

// ─── Tracking Helpers ─────────────────────────────────────────────────────────

function openPixelUrl(logId: string): string {
  return `${TRACK_BASE}?type=open&id=${logId}`;
}

function clickTrackUrl(logId: string, targetUrl: string): string {
  return `${TRACK_BASE}?type=click&id=${logId}&url=${encodeURIComponent(targetUrl)}`;
}

function injectOpenPixel(html: string, pixelUrl: string): string {
  const tag = `<img src="${pixelUrl}" width="1" height="1" style="display:none;border:0;" alt="" />`;
  return html.includes("</body>") ? html.replace("</body>", `${tag}</body>`) : html + tag;
}

function wrapLinks(html: string, logId: string): string {
  return html.replace(/href="(https?:\/\/[^"]+)"/gi, (_, url) => {
    if (url.includes("/track?") || url.includes("unsubscribe")) return `href="${url}"`;
    return `href="${clickTrackUrl(logId, url)}"`;
  });
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EMAIL_PROXY_SECRET  = Deno.env.get("EMAIL_PROXY_SECRET");
    const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY   = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SRK        = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!EMAIL_PROXY_SECRET) throw new Error("EMAIL_PROXY_SECRET is not configured");

    const body = await req.json();
    const { to, subject, html, text, from_name, reply_to, recipient_name, template_id, sequence_id } = body;

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: "to and subject are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SRK || SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 1. Create email_log entry ────────────────────────────────────────────
    let logId: string | undefined;
    try {
      const { data } = await supabase.rpc("insert_email_log", {
        p_recipient_email: to,
        p_subject:         subject,
        p_recipient_name:  recipient_name || null,
        p_status:          "queued",
        p_template_id:     template_id   || null,
        p_sequence_id:     sequence_id   || null,
      });
      logId = data as string;
    } catch (e) {
      console.warn("[send-email] insert_email_log RPC failed:", e);
    }

    // ── 2. Build tracked HTML ────────────────────────────────────────────────
    let finalHtml = html || `<p>${text || ""}</p>`;
    if (logId) {
      finalHtml = injectOpenPixel(finalHtml, openPixelUrl(logId));
      finalHtml = wrapLinks(finalHtml, logId);
    }

    // ── 3. Send via HTTP Proxy (routes SMTP through VPS) ────────────────────
    const fromAddress = "Valentin@trumpetstar.com";
    const fromDisplay = from_name || "Valentin von Trumpetstar";

    const proxyPayload = {
      from:     `"${fromDisplay}" <${fromAddress}>`,
      to,
      subject,
      html:     finalHtml,
      text:     text || "",
      replyTo:  reply_to || fromAddress,
    };

    const proxyRes = await fetch(EMAIL_PROXY_URL, {
      method:  "POST",
      headers: {
        "Content-Type":   "application/json",
        "x-proxy-secret": EMAIL_PROXY_SECRET,
      },
      body: JSON.stringify(proxyPayload),
    });

    if (!proxyRes.ok) {
      const errText = await proxyRes.text();
      throw new Error(`Proxy error ${proxyRes.status}: ${errText}`);
    }

    const proxyData = await proxyRes.json().catch(() => ({}));
    const messageId = proxyData.messageId || proxyData.message_id || "proxy-sent";

    console.log("[send-email] Sent via proxy:", messageId, "to:", to, "logId:", logId);

    // ── 4. Mark as sent ──────────────────────────────────────────────────────
    if (logId) {
      try { await supabase.rpc("mark_email_sent", { p_id: logId }); } catch (_) { /* ignore */ }
    }

    return new Response(
      JSON.stringify({ success: true, messageId, logId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[send-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
