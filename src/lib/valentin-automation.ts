// =====================================================
// VALENTIN - MARKETING AUTOMATION ENGINE
// =====================================================

import { supabase as supabaseClient } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = supabaseClient as any;

// Konstanten
const SCORE_THRESHOLDS = {
  COLD: 0,
  WARM: 3,
  HOT: 7,
  CONVERTED: 10
};

const EMAIL_TIMINGS = {
  DAY_0: 0,      // Sofort
  DAY_1: 24,     // 1 Tag später
  DAY_3: 72,     // 3 Tage später
  DAY_5: 120,    // 5 Tage später
  DAY_7: 168     // 7 Tage später
};

// =====================================================
// 1. LEAD-VERARBEITUNG (Bei neuer Registrierung)
// =====================================================

export async function processNewLead(leadData: {
  email: string;
  firstName: string;
  segmentCode: string;
  source: string;
  instrument?: string;
}) {
  console.log(`[Valentin] Processing new lead: ${leadData.email}`);
  
  // 1. Lead speichern
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      email: leadData.email,
      first_name: leadData.firstName,
      segment_id: await getSegmentId(leadData.segmentCode),
      instrument: leadData.instrument,
      source: leadData.source,
      status: 'new'
    })
    .select()
    .single();
  
  if (error || !lead) {
    console.error('[Valentin] Error creating lead:', error);
    return;
  }
  
  // 2. Willkommens-E-Mail sofort senden (Tag 0)
  await scheduleEmail(lead.id, 0);
  
  // 3. Weitere E-Mails einplanen
  await scheduleEmail(lead.id, 1);
  await scheduleEmail(lead.id, 3);
  await scheduleEmail(lead.id, 5);
  await scheduleEmail(lead.id, 7);
  
  console.log(`[Valentin] Lead ${lead.id} enrolled in sequence`);
  
  return lead;
}

// =====================================================
// 2. E-MAIL-SCHEDULING
// =====================================================

async function scheduleEmail(leadId: string, dayNumber: number) {
  // Template für diesen Tag finden
  const { data: template } = await supabase
    .from('email_templates')
    .select('id')
    .eq('day_number', dayNumber)
    .eq('is_active', true)
    .single();
  
  if (!template) return;
  
  // Sendezeit berechnen
  const hoursFromNow = getHoursForDay(dayNumber);
  const scheduledFor = new Date();
  scheduledFor.setHours(scheduledFor.getHours() + hoursFromNow);
  
  // In Queue eintragen
  await supabase
    .from('email_queue')
    .insert({
      lead_id: leadId,
      template_id: template.id,
      scheduled_for: scheduledFor.toISOString(),
      status: 'pending'
    });
}

function getHoursForDay(day: number): number {
  const map: Record<number, number> = {
    0: 0,      // Sofort
    1: 24,     // +24h
    3: 72,     // +72h
    5: 120,    // +120h
    7: 168     // +168h
  };
  return map[day] || 24;
}

// =====================================================
// 3. BOT-INTELLIGENZ (Dynamische Anpassungen)
// =====================================================

export async function analyzeAndOptimize(leadId: string) {
  console.log(`[Valentin] Analyzing lead ${leadId}`);
  
  // Lead-Daten holen
  const { data: lead } = await supabase
    .from('leads')
    .select('*, lead_email_logs(*)')
    .eq('id', leadId)
    .single();
  
  if (!lead) return;
  
  // Letzte E-Mail prüfen
  const lastEmail = lead.lead_email_logs?.[0];
  if (!lastEmail) return;
  
  // REGEL 1: Nicht geöffnet nach 24h
  if (!lastEmail.opened_at && hoursSince(lastEmail.sent_at) > 24) {
    await applyStrategy('no_open', leadId, {
      reason: 'Email not opened after 24h',
      action: 'Send shorter followup with different subject'
    });
  }
  
  // REGEL 2: Geöffnet aber nicht geklickt
  if (lastEmail.opened_at && !lastEmail.clicked_at) {
    await applyStrategy('no_click', leadId, {
      reason: 'Opened but not clicked',
      action: 'Emphasize CTA more strongly'
    });
  }
  
  // REGEL 3: Geklickt aber nicht gekauft
  if (lastEmail.clicked_at && !lead.purchased) {
    await applyStrategy('click_no_purchase', leadId, {
      reason: 'Interested but hesitating',
      action: 'Send objection handler'
    });
  }
  
  // REGEL 4: Hoher Aktivitäts-Score
  if (lead.activity_score >= SCORE_THRESHOLDS.HOT && !lead.purchased) {
    await applyStrategy('hot_lead', leadId, {
      reason: 'High engagement score',
      action: 'Accelerate offer, early access'
    });
  }
}

async function applyStrategy(
  strategyType: string,
  leadId: string,
  details: { reason: string; action: string }
) {
  console.log(`[Valentin] Applying strategy: ${strategyType}`);
  
  // Entscheidung loggen
  await supabase.from('bot_decisions').insert({
    lead_id: leadId,
    decision_type: strategyType,
    reason: details.reason,
    adjusted_action: details.action
  });
  
  // Strategie-spezifische Aktionen
  switch (strategyType) {
    case 'no_open':
      await modifyNextEmail(leadId, {
        subjectPrefix: '🔔 ',
        bodyPrefix: 'Ich wollte sicherstellen, dass du das siehst...',
        shorter: true
      });
      break;
      
    case 'no_click':
      await modifyNextEmail(leadId, {
        biggerCTA: true,
        emphasizeValue: true
      });
      break;
      
    case 'click_no_purchase':
      await insertObjectionHandler(leadId);
      break;
      
    case 'hot_lead':
      await accelerateOffer(leadId);
      break;
  }
}

// =====================================================
// 4. E-MAIL-MODIFIKATIONEN
// =====================================================

async function modifyNextEmail(
  leadId: string,
  modifications: {
    subjectPrefix?: string;
    bodyPrefix?: string;
    shorter?: boolean;
    biggerCTA?: boolean;
    emphasizeValue?: boolean;
  }
) {
  // Nächste geplante E-Mail finden
  const { data: nextEmail } = await supabase
    .from('email_queue')
    .select('*')
    .eq('lead_id', leadId)
    .eq('status', 'pending')
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .single();
  
  if (!nextEmail) return;
  
  // Als modifiziert markieren
  await supabase
    .from('email_queue')
    .update({
      status: 'modified',
      modification_data: modifications
    })
    .eq('id', nextEmail.id);
  
  console.log(`[Valentin] Modified email ${nextEmail.id}`);
}

async function insertObjectionHandler(leadId: string) {
  // Einwand-Behandlungs-E-Mail einfügen
  const objectionEmail = await supabase
    .from('email_templates')
    .select('id')
    .eq('day_number', -1) // Spezielle Einwand-Template
    .single();
  
  if (objectionEmail.data) {
    await supabase.from('email_queue').insert({
      lead_id: leadId,
      template_id: objectionEmail.data.id,
      scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    });
  }
}

async function accelerateOffer(leadId: string) {
  // Angebot früher zeigen
  await supabase
    .from('email_queue')
    .update({ scheduled_for: new Date().toISOString() })
    .eq('lead_id', leadId)
    .eq('status', 'pending')
    .order('scheduled_for', { ascending: true })
    .limit(1);
}

// =====================================================
// 5. TRACKING & SCORING
// =====================================================

export async function trackEmailOpen(logId: string) {
  await supabase
    .from('lead_email_logs')
    .update({ opened_at: new Date().toISOString() })
    .eq('id', logId);
  
  // Score erhöhen
  await incrementScore(logId, 1);
}

export async function trackEmailClick(logId: string, link: string) {
  await supabase
    .from('lead_email_logs')
    .update({
      clicked_at: new Date().toISOString(),
      clicked_link: link
    })
    .eq('id', logId);
  
  // Score erhöhen
  await incrementScore(logId, 2);
}

async function incrementScore(logId: string, points: number) {
  const { data: log } = await supabase
    .from('lead_email_logs')
    .select('lead_id')
    .eq('id', logId)
    .single();
  
  if (log) {
    await supabase.rpc('increment_lead_score', {
      lead_id: log.lead_id,
      points: points
    });
  }
}

// =====================================================
// 6. CRON-JOBS (Regelmäßige Aufgaben)
// =====================================================

// Jede Stunde: Verschicke geplante E-Mails
export async function processEmailQueue() {
  const { data: emails } = await supabase
    .from('email_queue')
    .select('*, leads(*), email_templates(*)')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString());
  
  for (const email of emails || []) {
    await sendEmail(email);
  }
}

async function sendEmail(queueItem: any) {
  // Hier würde die tatsächliche E-Mail-Versendung passieren
  // Via SendGrid, Mailgun, etc.
  console.log(`[Valentin] Sending email to ${queueItem.leads.email}`);
  
  // Als gesendet markieren
  await supabase
    .from('email_queue')
    .update({ status: 'sent' })
    .eq('id', queueItem.id);
  
  // In Logs eintragen
  await supabase.from('lead_email_logs').insert({
    lead_id: queueItem.lead_id,
    template_id: queueItem.template_id,
    subject_used: queueItem.email_templates.subject_line
  });
}

// Täglich: Analysiere alle aktiven Leads
export async function dailyAnalysis() {
  const { data: activeLeads } = await supabase
    .from('leads')
    .select('id')
    .eq('status', 'active')
    .eq('purchased', false);
  
  for (const lead of activeLeads || []) {
    await analyzeAndOptimize(lead.id);
  }
}

// =====================================================
// HILFSFUNKTIONEN
// =====================================================

async function getSegmentId(code: string): Promise<string> {
  const { data } = await supabase
    .from('lead_segments')
    .select('id')
    .eq('code', code)
    .single();
  return data?.id || '';
}

function hoursSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
}

// =====================================================
// EXPORT
// =====================================================

export const ValentinAutomation = {
  processNewLead,
  analyzeAndOptimize,
  trackEmailOpen,
  trackEmailClick,
  processEmailQueue,
  dailyAnalysis
};
