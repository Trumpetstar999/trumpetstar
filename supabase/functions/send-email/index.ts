import nodemailer from "npm:nodemailer";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Tracking Helpers ─────────────────────────────────────────────────────────

function buildTrackUrl(base: string, type: "open" | "click", id: string, url?: string): string {
  const params = new URLSearchParams({ type, id });
  if (url) params.set("url", url);
  return `${base}/functions/v1/track?${params.toString()}`;
}

/** Inject 1x1 open-tracking pixel before </body> or at end of HTML */
function injectOpenPixel(html: string, pixelUrl: string): string {
  const pixelTag = `<img src="${pixelUrl}" width="1" height="1" style="display:none;border:0;" alt="" />`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixelTag}</body>`);
  }
  return html + pixelTag;
}

/** Wrap every <a href="..."> link with click-tracking redirect */
function wrapLinks(html: string, baseUrl: string, logId: string): string {
  return html.replace(
    /href="(https?:\/\/[^"]+)"/gi,
    (_, originalUrl) => {
      // Don't double-wrap already-tracked links or unsubscribe links
      if (originalUrl.includes("/track?") || originalUrl.includes("unsubscribe")) {
        return `href="${originalUrl}"`;
      }
      const trackUrl = buildTrackUrl(baseUrl, "click", logId, encodeURIComponent(originalUrl));
      return `href="${trackUrl}"`;
    }
  );
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
    if (!SMTP_PASSWORD) throw new Error("SMTP_PASSWORD is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json();
    const { to, subject, html, text, from_name, reply_to, recipient_name, template_id, sequence_id } = body;

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: "to and subject are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 1. Create email_log entry FIRST to get the tracking ID ──────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: logRow, error: logInsertErr } = await supabase
      .from("email_log")
      .insert({
        recipient_email: to,
        recipient_name: recipient_name || null,
        subject,
        status: "queued",
        template_id: template_id || null,
        sequence_id: sequence_id || null,
      })
      .select("id")
      .single();

    if (logInsertErr || !logRow?.id) {
      console.warn("[send-email] Could not create log entry:", logInsertErr?.message);
    }

    const logId = logRow?.id as string | undefined;

    // ── 2. Build HTML with tracking injected ────────────────────────────────
    let finalHtml = html || `<p>${text || ""}</p>`;

    if (logId) {
      const openPixelUrl = buildTrackUrl(SUPABASE_URL, "open", logId);
      finalHtml = injectOpenPixel(finalHtml, openPixelUrl);
      finalHtml = wrapLinks(finalHtml, SUPABASE_URL, logId);
    }

    // ── 3. Send via SMTP ─────────────────────────────────────────────────────
    const transporter = nodemailer.createTransport({
      host: "smtp.world4you.com",
      port: 587,
      secure: false,
      auth: {
        user: "Valentin@trumpetstar.com",
        pass: SMTP_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
    });

    const mailOptions = {
      from: `"${from_name || "Valentin von Trumpetstar"}" <Valentin@trumpetstar.com>`,
      to,
      subject,
      html: finalHtml,
      text: text || "",
      replyTo: reply_to || "Valentin@trumpetstar.com",
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[send-email] Sent:", info.messageId, "to:", to);

    // ── 4. Update log entry to "sent" ────────────────────────────────────────
    if (logId) {
      await supabase
        .from("email_log")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId, logId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[send-email] Error:", error);
    // Mark log entry as failed if we have the ID
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
