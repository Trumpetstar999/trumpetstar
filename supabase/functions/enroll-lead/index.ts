import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Email automation: schedule emails at day 0, 1, 3, 5, 7
const EMAIL_SCHEDULE_DAYS = [0, 1, 3, 5, 7];
const HOURS_MAP: Record<number, number> = { 0: 0, 1: 24, 3: 72, 5: 120, 7: 168 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { user_id, email, display_name, segment, language, source } = body;

    if (!user_id || !email) {
      return new Response(JSON.stringify({ error: "user_id and email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = ["de", "en", "es"].includes(language) ? language : "de";
    const seg = segment || "adult";
    const firstName = display_name || "";

    // 1) Upsert lead – set stage to 'new' only if not already existing
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, stage")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    let leadId: string;

    if (existingLead) {
      leadId = existingLead.id;
      // Only update auth_user_id and last_contact_at; don't overwrite stage/score
      await supabase
        .from("leads")
        .update({
          auth_user_id: user_id,
          first_name: firstName || undefined,
          last_contact_at: new Date().toISOString(),
        })
        .eq("id", leadId);
      console.log("[enroll-lead] Updated existing lead:", leadId);
    } else {
      // New lead from signup (not from landing page capture)
      const { data: newLead, error: insertError } = await supabase
        .from("leads")
        .insert({
          email: email.toLowerCase(),
          first_name: firstName,
          auth_user_id: user_id,
          segment: seg,
          language: lang,
          source: source || "signup",
          stage: "new",
          assignee: "Valentin",
          first_contact_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError || !newLead) {
        console.error("[enroll-lead] Failed to create lead:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create lead" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      leadId = newLead.id;
      console.log("[enroll-lead] Created new lead:", leadId);
    }

    // 2) Check if lead is already enrolled (has pending queue entries)
    const { data: existingQueue } = await supabase
      .from("email_queue")
      .select("id")
      .eq("lead_id", leadId)
      .eq("status", "pending")
      .limit(1);

    if (existingQueue && existingQueue.length > 0) {
      console.log("[enroll-lead] Lead already in queue, skipping enrollment");
      return new Response(
        JSON.stringify({ success: true, lead_id: leadId, enrolled: false, reason: "already_enrolled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3) Schedule email sequence
    let scheduledCount = 0;
    for (const day of EMAIL_SCHEDULE_DAYS) {
      // Find active template for this day number
      const { data: template } = await supabase
        .from("email_templates")
        .select("id")
        .eq("template_key", `sequence_day_${day}`)
        .maybeSingle();

      const hoursFromNow = HOURS_MAP[day] ?? 24;
      const scheduledFor = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();

      await supabase.from("email_queue").insert({
        lead_id: leadId,
        template_id: template?.id ?? null,
        scheduled_for: scheduledFor,
        status: "pending",
      });
      scheduledCount++;
    }

    // 4) Log activity
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "signup",
      description: `Nutzer hat sich registriert (${source || "signup"}). ${scheduledCount} E-Mails eingeplant.`,
      performed_by: "System",
    });

    console.log(`[enroll-lead] Lead ${leadId} enrolled: ${scheduledCount} emails queued`);

    return new Response(
      JSON.stringify({ success: true, lead_id: leadId, enrolled: true, emails_scheduled: scheduledCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[enroll-lead] Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
