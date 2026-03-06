import nodemailer from "npm:nodemailer";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Track-Function auf Marios eigenem Supabase-Projekt (hat keine Lovable-Zugriffsbeschränkungen)
const TRACK_BASE = "https://rhnhhjidsnrlwxtbarvf.supabase.co/functions/v1/track";

// ─── Tracking Helpers ─────────────────────────────────────────────────────────

function openPixelUrl(logId: string): string {
  return `${TRACK_BASE}?type=open&id=${logId}`;
}

function clickTrackUrl(logId: string, targetUrl: string): string {
  return `${TRACK_BASE}?type=click&id=${logId}&url=${encodeURIComponent(targetUrl)}`;
}

/** Inject 1x1 open-tracking pixel before </body> */
function injectOpenPixel(html: string, pixelUrl: string): string {
  const tag = `<img src="${pixelUrl}" width="1" height="1" style="display:none;border:0;" alt="" />`;
  return html.includes("</body>") ? html.replace("</body>", `${tag}</body>`) : html + tag;
}

/** Wrap <a href="..."> with click-tracking redirect */
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
    const SMTP_PASSWORD       = Deno.env.get("SMTP_PASSWORD");
    const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY   = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SRK        = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SMTP_PASSWORD) throw new Error("SMTP_PASSWORD is not configured");

    const body = await req.json();
    const { to, subject, html, text, from_name, reply_to, recipient_name, template_id, sequence_id } = body;

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: "to and subject are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role key if available, anon key as fallback (RPC functions allow anon)
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SRK || SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 1. Create email_log entry via RPC (SECURITY DEFINER → bypasses RLS) ──
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

    // ── 3. Send via SMTP ─────────────────────────────────────────────────────
    const transporter = nodemailer.createTransport({
      host: "smtp.world4you.com",
      port: 587,
      secure: false,
      auth: { user: "Valentin@trumpetstar.com", pass: SMTP_PASSWORD },
      tls: { rejectUnauthorized: false },
    });

    const info = await transporter.sendMail({
      from:    `"${from_name || "Valentin von Trumpetstar"}" <Valentin@trumpetstar.com>`,
      to,
      subject,
      html:    finalHtml,
      text:    text || "",
      replyTo: reply_to || "Valentin@trumpetstar.com",
    });

    console.log("[send-email] Sent:", info.messageId, "to:", to, "logId:", logId);

    // ── 4. Mark as sent ──────────────────────────────────────────────────────
    if (logId) {
      await supabase.rpc("mark_email_sent", { p_id: logId }).catch(() => {});
    }

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId, logId }),
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
