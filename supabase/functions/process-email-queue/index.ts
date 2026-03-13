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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const EMAIL_PROXY_SECRET = Deno.env.get("EMAIL_PROXY_SECRET");

    if (!EMAIL_PROXY_SECRET) throw new Error("EMAIL_PROXY_SECRET is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 20;

    // 1) Fetch pending queue entries whose scheduled_for <= now
    const { data: queueItems, error: fetchErr } = await supabase
      .from("email_queue")
      .select("id, lead_id, template_id, scheduled_for")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(batchSize);

    if (fetchErr) {
      console.error("[process-queue] Fetch error:", fetchErr);
      throw new Error(fetchErr.message);
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No pending emails" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-queue] Processing ${queueItems.length} emails`);

    let sent = 0;
    let failed = 0;

    for (const item of queueItems) {
      try {
        // Mark as processing to prevent double-sends
        await supabase
          .from("email_queue")
          .update({ status: "processing" } as any)
          .eq("id", item.id);

        // Get lead info
        const { data: lead } = await supabase
          .from("leads")
          .select("email, first_name, name, language, segment")
          .eq("id", item.lead_id)
          .single();

        if (!lead || !lead.email) {
          console.warn(`[process-queue] No lead found for queue item ${item.id}`);
          await supabase.from("email_queue").update({ status: "failed" } as any).eq("id", item.id);
          failed++;
          continue;
        }

        // Get template
        let subject = "Nachricht von Trumpetstar";
        let htmlBody = "<p>Hallo!</p>";

        if (item.template_id) {
          const { data: template } = await supabase
            .from("email_templates")
            .select("*")
            .eq("id", item.template_id)
            .single();

          if (template) {
            const lang = lead.language || "de";

            if (lang === "en" && template.subject_en) {
              subject = template.subject_en;
              htmlBody = template.body_html_en || template.body_html_de;
            } else if (lang === "es" && template.subject_es) {
              subject = template.subject_es;
              htmlBody = template.body_html_es || template.body_html_de;
            } else {
              subject = template.subject_de;
              htmlBody = template.body_html_de;
            }

            const firstName = lead.first_name || lead.name || "";
            htmlBody = htmlBody
              .replace(/\{\{Vorname\}\}/g, firstName)
              .replace(/\{\{vorname\}\}/g, firstName)
              .replace(/\{\{name\}\}/g, firstName)
              .replace(/\{\{email\}\}/g, lead.email);
            subject = subject
              .replace(/\{\{Vorname\}\}/g, firstName)
              .replace(/\{\{vorname\}\}/g, firstName);
          }
        }

        // Send via HTTP proxy
        const proxyRes = await fetch(EMAIL_PROXY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-proxy-secret": EMAIL_PROXY_SECRET,
          },
          body: JSON.stringify({
            from: '"Valentin von Trumpetstar" <Valentin@trumpetstar.com>',
            to: lead.email,
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
        console.log(`[process-queue] Sent to ${lead.email}: ${subject} (${messageId})`);

        // Mark as sent
        await supabase
          .from("email_queue")
          .update({ status: "sent" } as any)
          .eq("id", item.id);

        // Log to email_log
        await supabase.from("email_log").insert({
          recipient_email: lead.email,
          recipient_name: lead.first_name || lead.name || null,
          subject,
          status: "sent",
          sent_at: new Date().toISOString(),
          template_id: item.template_id,
        });

        sent++;
      } catch (sendErr) {
        console.error(`[process-queue] Failed to send queue item ${item.id}:`, sendErr);
        await supabase
          .from("email_queue")
          .update({ status: "failed" } as any)
          .eq("id", item.id);

        await supabase.from("email_log").insert({
          recipient_email: "unknown",
          subject: "Failed to send",
          status: "failed",
          error_message: String(sendErr),
          template_id: item.template_id,
        });

        failed++;
      }
    }

    console.log(`[process-queue] Done: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, processed: queueItems.length, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[process-queue] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
