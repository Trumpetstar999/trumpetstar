import nodemailer from "npm:nodemailer";

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
    if (!SMTP_PASSWORD) throw new Error("SMTP_PASSWORD is not configured");

    const body = await req.json();
    const { to, subject, html, text, from_name, reply_to } = body;

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: "to and subject are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      html: html || `<p>${text || ''}</p>`,
      text: text || "",
      replyTo: reply_to || "Valentin@trumpetstar.com",
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[send-email] Sent:", info.messageId, "to:", to);

    // Log to email_log table
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      await supabase.from("email_log").insert({
        recipient_email: to,
        subject,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.warn("[send-email] Logging failed (non-fatal):", logErr);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
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
