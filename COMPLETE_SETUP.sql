-- =====================================================
-- TRUMPETSTAR MARKETING AUTOMATION - KOMPLETTES SQL
-- Führe dies im Lovable SQL Editor aus (alles auf einmal)
-- =====================================================

-- 1. Lead Segmente
CREATE TABLE IF NOT EXISTS lead_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  characteristics jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2. Leads (erweitert)
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text,
  last_name text,
  segment_id uuid REFERENCES lead_segments(id),
  instrument text,
  level text,
  goal text,
  language text DEFAULT 'de',
  source text,
  source_details jsonb,
  activity_score integer DEFAULT 0,
  email_opens integer DEFAULT 0,
  email_clicks integer DEFAULT 0,
  last_activity_at timestamptz,
  status text DEFAULT 'new',
  purchased boolean DEFAULT false,
  purchased_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Email Sequences
CREATE TABLE IF NOT EXISTS email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  segment_id uuid REFERENCES lead_segments(id),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES email_sequences(id),
  day_number integer NOT NULL,
  subject_line text NOT NULL,
  subject_line_b text,
  body_html text NOT NULL,
  body_text text NOT NULL,
  cta_link text,
  cta_text text,
  personalization_tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 5. Lead Email Logs
CREATE TABLE IF NOT EXISTS lead_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  template_id uuid REFERENCES email_templates(id),
  sent_at timestamptz DEFAULT now(),
  subject_used text,
  opened_at timestamptz,
  clicked_at timestamptz,
  clicked_link text,
  replied_at timestamptz,
  reply_content text,
  bounced boolean DEFAULT false,
  unsubscribed boolean DEFAULT false,
  was_modified_by_bot boolean DEFAULT false,
  modification_reason text
);

-- 6. Lead Activities
CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  activity_type text NOT NULL,
  activity_data jsonb,
  score_value integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- 7. Bot Decisions
CREATE TABLE IF NOT EXISTS bot_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  decision_type text NOT NULL,
  trigger_condition text,
  original_action text,
  adjusted_action text,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- 8. Email Queue
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  template_id uuid REFERENCES email_templates(id),
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- SEED-DATEN (SOFORT NACH TABELLEN EINFÜGEN)
-- =====================================================

-- Segmente
INSERT INTO lead_segments (code, name, description, characteristics) VALUES
('adult', 'Erwachsene Anfänger/Wiedereinsteiger', '25-65 Jahre, wenig Zeit, Disziplin', '{"pain_points": ["Keine Zeit", "Zu alt"], "messaging": "Zeit-effizient, nie zu spät"}'),
('parent', 'Eltern + Kind (6-14)', 'Elternteil registriert, Kind 6-14 Jahre', '{"pain_points": ["Motivation", "Üben"], "messaging": "Gamification, Spaß"}'),
('teacher', 'Lehrer/Dirigent/Bläserklasse', 'Musiklehrer, Dirigenten, B2B', '{"pain_points": ["Unterschiedliche Levels", "Wenig Zeit"], "messaging": "Klassen-Workflow, Materialien"}')
ON CONFLICT (code) DO NOTHING;

-- Sequenzen
INSERT INTO email_sequences (name, segment_id, description) 
SELECT '7-Tage Willkommen - Erwachsene', id, 'Willkommenssequenz für erwachsene Anfänger'
FROM lead_segments WHERE code = 'adult'
ON CONFLICT DO NOTHING;

INSERT INTO email_sequences (name, segment_id, description)
SELECT '7-Tage Willkommen - Eltern', id, 'Willkommenssequenz für Eltern mit Kindern'
FROM lead_segments WHERE code = 'parent'
ON CONFLICT DO NOTHING;

INSERT INTO email_sequences (name, segment_id, description)
SELECT '5-Tage B2B - Lehrer', id, 'B2B-Sequenz für Musiklehrer'
FROM lead_segments WHERE code = 'teacher'
ON CONFLICT DO NOTHING;

-- Template: Tag 0 (Willkommen Erwachsene)
INSERT INTO email_templates (sequence_id, day_number, subject_line, subject_line_b, body_html, body_text, cta_link, cta_text, personalization_tags)
SELECT 
  (SELECT id FROM email_sequences WHERE name = '7-Tage Willkommen - Erwachsene'),
  0,
  'Willkommen {{first_name}} – hier ist dein erster Schritt',
  'Deine Trompeten-Reise beginnt jetzt',
  '<h1>Hallo {{first_name}},</h1><p>schön, dass du da bist!</p><p>Du hast dich für {{instrument}} entschieden – das ist eine großartige Wahl.</p><p>Ich weiß: Als Erwachsener hast du wenig Zeit. Deshalb ist unsere Methode auf <strong>5-Minuten-Einheiten</strong> ausgelegt.</p><a href="{{cta_link}}" style="display:inline-block;padding:16px 32px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;">👉 Ersten Schritt ansehen</a><p>PS: Die häufigste Frage: „Bin ich zu alt?“<br>Antwort: Absolut nicht.</p>',
  'Hallo {{first_name}}, schön dass du da bist! Du hast dich für {{instrument}} entschieden. Ich weiß: Als Erwachsener hast du wenig Zeit. Deshalb ist unsere Methode auf 5-Minuten-Einheiten ausgelegt. Hier ist dein erster Schritt: {{cta_link}} PS: Die häufigste Frage: Bin ich zu alt? Antwort: Absolut nicht.',
  '/erste-schritte',
  'Ersten Schritt ansehen',
  ARRAY['first_name', 'instrument']
ON CONFLICT DO NOTHING;

-- Template: Tag 1 (Mini-Erfolg)
INSERT INTO email_templates (sequence_id, day_number, subject_line, body_html, body_text, cta_link, cta_text)
SELECT 
  (SELECT id FROM email_sequences WHERE name = '7-Tage Willkommen - Erwachsene'),
  1,
  '2 Minuten Übung – mach das jetzt',
  '<h2>Übung: Das erste Buzzing</h2><p>Ohne Instrument. Nur die Lippen. 2 Minuten.</p><a href="{{cta_link}}">Video-Anleitung ansehen</a><p>Und dann antworte mir einfach: „Fertig."</p>',
  'Übung: Das erste Buzzing. Ohne Instrument. Nur die Lippen. 2 Minuten. Video: {{cta_link}} Und dann antworte mir einfach: Fertig.',
  '/videos/buzzing',
  'Video ansehen'
ON CONFLICT DO NOTHING;

-- Template: Tag 3 (Social Proof)
INSERT INTO email_templates (sequence_id, day_number, subject_line, body_html, body_text)
SELECT 
  (SELECT id FROM email_sequences WHERE name = '7-Tage Willkommen - Erwachsene'),
  3,
  '„Ich dachte, mit 45 ist es zu spät" – Peter',
  '<p>Ich möchte dir Peter vorstellen. Mit 45 hat er begonnen. Nach 3 Monaten spielte er seine ersten Songs.</p><p><em>„Ich dachte, ich bin zu alt. Aber die 5-Minuten-Methode passt perfekt in meinen Arbeitstag."</em></p><p>Die häufigste Hürde: „Meine Lippen werden so schnell müde."</p>',
  'Ich möchte dir Peter vorstellen. Mit 45 hat er begonnen. Nach 3 Monaten spielte er seine ersten Songs. Ich dachte, ich bin zu alt. Aber die 5-Minuten-Methode passt perfekt in meinen Arbeitstag.'
ON CONFLICT DO NOTHING;

-- Template: Tag 5 (Soft Offer)
INSERT INTO email_templates (sequence_id, day_number, subject_line, body_html, body_text, cta_link, cta_text)
SELECT 
  (SELECT id FROM email_sequences WHERE name = '7-Tage Willkommen - Erwachsene'),
  5,
  'Das hat mir am Anfang gefehlt',
  '<p>Als ich angefangen habe, gab es keine strukturierte Methode.</p><p>Heute gibt es Trumpetstar – die Methode, die ich mir damals gewünscht hätte.</p><ul><li>Schritt-für-Schritt Anleitungen</li><li>Video-Tutorials</li><li>App mit Tracking</li></ul><a href="{{cta_link}}">Mehr über den Pro-Kurs</a><p>PS: 30-Tage-Geld-zurück-Garantie.</p>',
  'Als ich angefangen habe, gab es keine strukturierte Methode. Heute gibt es Trumpetstar. Falls du bereit bist: {{cta_link}} PS: 30-Tage-Geld-zurück-Garantie.',
  '/kurse/pro',
  'Pro-Kurs entdecken'
ON CONFLICT DO NOTHING;

-- Template: Tag 7 (Deadline)
INSERT INTO email_templates (sequence_id, day_number, subject_line, body_html, body_text, cta_link, cta_text)
SELECT 
  (SELECT id FROM email_sequences WHERE name = '7-Tage Willkommen - Erwachsene'),
  7,
  'Letzte Chance: Bonus-Lektionen (heute Abend)',
  '<p>In den letzten 7 Tagen hast du dich mit der Materie beschäftigt.</p><p>Heute ist der letzte Tag für den Bonus:</p><ul><li>„Erste 30 Tage" detaillierter Plan</li><li>Exklusive Live-Q&A</li><li>Übeplan-Template</li></ul><a href="{{cta_link}}">Nur heute: Pro-Kurs mit Bonus</a><p>Nach heute sind die Bonus-Lektionen nicht mehr verfügbar.</p>',
  'Heute ist der letzte Tag für den Bonus: Erste 30 Tage Plan, Live-Q&A, Übeplan-Template. {{cta_link}} Nach heute nicht mehr verfügbar.',
  '/kurse/pro?bonus=true',
  'Bonus sichern'
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS POLICIES (SICHERHEIT)
-- =====================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "allow_read" ON leads FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "allow_insert" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_read" ON email_sequences FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "allow_read" ON email_templates FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "allow_read" ON lead_email_logs FOR SELECT USING (true);

-- =====================================================
-- ERLEDIGT!
-- =====================================================
-- Alle Tabellen erstellt und mit Seed-Daten befüllt.
-- Du kannst jetzt im Dashboard die Daten sehen!
