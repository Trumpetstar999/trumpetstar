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
    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SMTP_PASSWORD) throw new Error("SMTP_PASSWORD is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase config");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 50;

    // Use IMAP via nodemailer IMAP simulation (using ImapFlow)
    // Since Deno doesn't have a native IMAP library easily, we use a workaround
    // by fetching via POP3 or IMAP through a compatible library

    let synced = 0;

    try {
      // Dynamic import of imapflow
      const { ImapFlow } = await import("npm:imapflow@1.0.169");

      const client = new ImapFlow({
        host: "imap.world4you.com",
        port: 993,
        secure: true,
        auth: {
          user: "Valentin@trumpetstar.com",
          pass: SMTP_PASSWORD,
        },
        logger: false,
      });

      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        const messages = [];
        for await (const message of client.fetch(
          { seen: false },
          {
            uid: true,
            flags: true,
            envelope: true,
            source: true,
            bodyStructure: true,
          }
        )) {
          messages.push(message);
          if (messages.length >= limit) break;
        }

        for (const msg of messages) {
          const envelope = msg.envelope;
          const messageId = envelope.messageId;

          // Check if already exists
          const { data: existing } = await supabase
            .from("mailbox_emails")
            .select("id")
            .eq("message_id", messageId || "")
            .maybeSingle();

          if (existing) continue;

          // Parse source for body
          const source = msg.source?.toString() || "";
          const htmlMatch = source.match(/Content-Type: text\/html[^]*?(?:\r?\n){2}([^]*?)(?:\r?\n--|\z)/i);
          const textMatch = source.match(/Content-Type: text\/plain[^]*?(?:\r?\n){2}([^]*?)(?:\r?\n--|\z)/i);

          const fromAddr = envelope.from?.[0];
          const toAddr = envelope.to?.[0];

          await supabase.from("mailbox_emails").upsert({
            message_id: messageId,
            from_email: fromAddr?.address || "",
            from_name: fromAddr?.name || "",
            to_email: toAddr?.address || "Valentin@trumpetstar.com",
            subject: envelope.subject || "(kein Betreff)",
            body_html: htmlMatch?.[1] || null,
            body_text: textMatch?.[1] || null,
            snippet: (textMatch?.[1] || envelope.subject || "").slice(0, 200),
            folder: "inbox",
            is_read: msg.flags?.has("\\Seen") || false,
            is_flagged: msg.flags?.has("\\Flagged") || false,
            received_at: envelope.date?.toISOString() || new Date().toISOString(),
          }, { onConflict: "message_id", ignoreDuplicates: true });

          synced++;
        }
      } finally {
        lock.release();
        await client.logout();
      }
    } catch (imapErr) {
      console.error("[fetch-emails] IMAP error:", imapErr);
      // Return partial success with error info
      return new Response(
        JSON.stringify({ synced, warning: "IMAP connection issue: " + String(imapErr) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, synced }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[fetch-emails] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
