import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map lead segment values to sequence template_key prefixes
const SEGMENT_TO_PREFIX: Record<string, string> = {
  child: "kinder_",
  parent: "kinder_",
  adult: "erwachsene_",
  teacher: "lehrer_",
};

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

    // 1) Upsert lead
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, stage")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    let leadId: string;

    if (existingLead) {
      leadId = existingLead.id;
      await supabase
        .from("leads")
        .update({
          auth_user_id: user_id,
          first_name: firstName || undefined,
          segment: seg,
          language: lang,
          last_contact_at: new Date().toISOString(),
        })
        .eq("id", leadId);
      console.log("[enroll-lead] Updated existing lead:", leadId);
    } else {
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

    // 3) Find the right sequence based on segment
    const prefix = SEGMENT_TO_PREFIX[seg] || "erwachsene_";
    
    // Get all active sequences
    const { data: sequences } = await supabase
      .from("email_sequences")
      .select("id, name")
      .eq("is_active", true);

    // Match sequence by checking if its steps use templates with the right prefix
    let matchedSequenceId: string | null = null;

    if (sequences && sequences.length > 0) {
      for (const seq of sequences) {
        const { data: steps } = await supabase
          .from("email_sequence_steps")
          .select("id, template_id")
          .eq("sequence_id", seq.id)
          .eq("is_active", true)
          .limit(1);

        if (steps && steps.length > 0 && steps[0].template_id) {
          const { data: tpl } = await supabase
            .from("email_templates")
            .select("template_key")
            .eq("id", steps[0].template_id)
            .single();

          if (tpl && tpl.template_key.startsWith(prefix)) {
            matchedSequenceId = seq.id;
            console.log(`[enroll-lead] Matched sequence "${seq.name}" for segment "${seg}"`);
            break;
          }
        }
      }
    }

    if (!matchedSequenceId) {
      console.warn(`[enroll-lead] No matching sequence for segment "${seg}", using first active`);
      matchedSequenceId = sequences?.[0]?.id ?? null;
    }

    if (!matchedSequenceId) {
      console.error("[enroll-lead] No active sequences found");
      return new Response(
        JSON.stringify({ success: true, lead_id: leadId, enrolled: false, reason: "no_active_sequence" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4) Get all steps for the matched sequence
    const { data: steps } = await supabase
      .from("email_sequence_steps")
      .select("id, step_order, template_id, delay_days, delay_hours, is_active")
      .eq("sequence_id", matchedSequenceId)
      .eq("is_active", true)
      .order("step_order", { ascending: true });

    if (!steps || steps.length === 0) {
      console.warn("[enroll-lead] No steps in matched sequence");
      return new Response(
        JSON.stringify({ success: true, lead_id: leadId, enrolled: false, reason: "no_steps" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5) Schedule emails based on sequence steps
    let scheduledCount = 0;
    const now = Date.now();

    for (const step of steps) {
      const delayMs = ((step.delay_days || 0) * 24 + (step.delay_hours || 0)) * 60 * 60 * 1000;
      const scheduledFor = new Date(now + delayMs).toISOString();

      const { error: queueErr } = await supabase.from("email_queue").insert({
        lead_id: leadId,
        template_id: step.template_id,
        scheduled_for: scheduledFor,
        status: "pending",
      });

      if (queueErr) {
        console.error(`[enroll-lead] Failed to queue step ${step.step_order}:`, queueErr);
      } else {
        scheduledCount++;
      }
    }

    // 6) Log activity
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "enrollment",
      description: `Segment "${seg}": ${scheduledCount} E-Mails eingeplant.`,
      performed_by: "System",
    });

    console.log(`[enroll-lead] Lead ${leadId} enrolled: ${scheduledCount} emails queued for segment "${seg}"`);

    return new Response(
      JSON.stringify({ success: true, lead_id: leadId, enrolled: true, emails_scheduled: scheduledCount, segment: seg }),
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
