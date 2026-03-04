const BASE = 'https://bfxwbiazhgtkjfdnkbwn.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmeHdiaWF6aGd0a2pmZG5rYnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODgzMDIsImV4cCI6MjA4NzE2NDMwMn0.lwF2MbCPM4S78Iav0skQbjYmrxIX4XbCOjZ6iTIvP6U';

const h = {
  'apikey': ANON,
  'Authorization': `Bearer ${ANON}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function sb(method, path, body) {
  const res = await fetch(`${BASE}/rest/v1/${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const t = await res.text();
  try { return JSON.parse(t); } catch { return t; }
}

// Known IDs
const SEQ_ID = '23437ea6-add0-4cf5-9d78-6628ae84b7bf';  // 7-Tage Willkommen - Erwachsene
const SEG_ID = 'b3476652-5d84-4e8a-954b-7e3eba2ecba3';  // adult

const TEMPLATES = [
  { day: 0, id: 'e62bc24e-3bd4-48fa-8974-63da387adc7b', subject: 'Willkommen Mario – hier ist dein erster Schritt' },
  { day: 1, id: 'c478be31-933e-4ac8-acff-793f6ea323ab', subject: '2 Minuten Übung – mach das jetzt' },
  { day: 3, id: 'c2cdaa5e-6462-4561-8a53-a86c6e9e6e86', subject: '„Ich dachte, mit 45 ist es zu spät" – Peter' },
  { day: 5, id: '60c2b8c6-f0f4-46b8-97da-859ffa392a9e', subject: 'Das hat mir am Anfang gefehlt' },
  { day: 7, id: '50643dad-9222-44b3-bd91-5dac6c77e5f7', subject: '⏰ Letzte Chance: Bonus-Lektionen (heute Abend)' },
];

async function run() {
  const now = new Date();

  // 1. Mario als Test-Lead inserieren
  console.log('📥 Inserting Mario as lead...');
  const leadRes = await sb('POST', 'leads', {
    email: 'schulterm@me.com',
    first_name: 'Mario',
    last_name: 'Schulter',
    name: 'Mario Schulter',
    segment_id: SEG_ID,
    segment: 'adult_beginner',
    source: 'manual',
    stage: 'interested',
    score: 10,
    product_interest: 'Trompete lernen – Erwachsene',
    instrument: 'Trompete',
    language: 'de',
    assignee: 'Valentin',
    tags: ['test', 'erwachsene', 'email-sequenz'],
    notes: 'Test-Lead: 5 Testmails am 2026-02-24 gesendet (7-Tage Erwachsene-Sequenz)',
    activity_score: 5,
    email_opens: 0,
    email_clicks: 0,
    purchased: false,
    first_contact_at: now.toISOString(),
    last_contact_at: now.toISOString(),
    lifetime_value: 0
  });

  const lead = Array.isArray(leadRes) ? leadRes[0] : leadRes;
  if (!lead?.id) {
    console.error('❌ Lead insert failed:', JSON.stringify(leadRes).slice(0, 200));
    return;
  }
  console.log(`✅ Lead: ${lead.id} (${lead.email})`);

  // 2. 5 Email-Logs einfügen
  console.log('\n📧 Inserting email logs...');
  for (const tmpl of TEMPLATES) {
    const sentAt = new Date(now);
    sentAt.setMinutes(now.getMinutes() - (TEMPLATES.length - TEMPLATES.indexOf(tmpl)) * 2);

    const logRes = await sb('POST', 'email_log', {
      recipient_email: 'schulterm@me.com',
      recipient_name: 'Mario Schulter',
      template_id: tmpl.id,
      sequence_id: SEQ_ID,
      subject: `[TEST] ${tmpl.subject}`,
      status: 'sent',
      sent_at: sentAt.toISOString(),
    });

    const log = Array.isArray(logRes) ? logRes[0] : logRes;
    if (log?.id) {
      console.log(`  ✅ Tag ${tmpl.day} → ${log.id}`);
    } else {
      console.error(`  ❌ Tag ${tmpl.day} failed:`, JSON.stringify(logRes).slice(0, 200));
    }
  }

  // 3. Email-Zähler am Lead updaten
  await sb('PATCH', `leads?id=eq.${lead.id}`, {
    email_opens: 0,
    email_clicks: 0,
    last_activity_at: now.toISOString()
  });

  console.log('\n✅ Done! Dashboard shows Mario + 5 sent emails.');
}

run().catch(console.error);
