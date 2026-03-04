-- Trumpetstar Marketing Automation Database Schema
-- Execute this in Lovable Supabase SQL Editor

-- =====================================================
-- 1. LEAD-SEGMENTE
-- =====================================================

CREATE TABLE lead_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  characteristics jsonb,
  created_at timestamptz DEFAULT now()
);

INSERT INTO lead_segments (code, name, description, characteristics) VALUES
('adult', 'Erwachsene Anfänger/Wiedereinsteiger', '25-65 Jahre, wenig Zeit, Disziplin', '{"pain_points": ["Keine Zeit", "Zu alt"], "messaging": "Zeit-effizient, nie zu spät"}'),
('parent', 'Eltern + Kind (6-14)', 'Elternteil registriert, Kind 6-14 Jahre', '{"pain_points": ["Motivation", "Üben"], "messaging": "Gamification, Spaß"}'),
('teacher', 'Lehrer/Dirigent/Bläserklasse', 'Musiklehrer, Dirigenten, B2B', '{"pain_points": ["Unterschiedliche Levels", "Wenig Zeit"], "messaging": "Klassen-Workflow, Materialien"}');

-- =====================================================
-- 2. LEADS (erweitert)
-- =====================================================

CREATE TABLE leads (
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

-- =====================================================
-- 3. E-MAIL-SEQUENZEN
-- =====================================================

CREATE TABLE email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  segment_id uuid REFERENCES lead_segments(id),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 4. E-MAIL-TEMPLATES
-- =====================================================

CREATE TABLE email_templates (
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

-- =====================================================
-- 5. LEAD-E-MAIL-VERLAUF (1:1 Tracking)
-- =====================================================

CREATE TABLE lead_email_logs (
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

-- =====================================================
-- 6. LEAD-AKTIVITÄTEN (Scoring)
-- =====================================================

CREATE TABLE lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  activity_type text NOT NULL,
  activity_data jsonb,
  score_value integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 7. BOT-ENTSCHEIDUNGEN (Audit)
-- =====================================================

CREATE TABLE bot_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  decision_type text NOT NULL,
  trigger_condition text,
  original_action text,
  adjusted_action text,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 8. AUTOMATION-QUEUE
-- =====================================================

CREATE TABLE email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  template_id uuid REFERENCES email_templates(id),
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXE
-- =====================================================

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_segment ON leads(segment_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_email_logs_lead ON lead_email_logs(lead_id);
CREATE INDEX idx_email_logs_sent ON lead_email_logs(sent_at);
CREATE INDEX idx_queue_scheduled ON email_queue(scheduled_for);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_read" ON leads FOR SELECT USING (true);
CREATE POLICY "allow_all_read" ON email_sequences FOR SELECT USING (true);
CREATE POLICY "allow_all_read" ON email_templates FOR SELECT USING (true);
CREATE POLICY "allow_all_read" ON lead_email_logs FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON leads FOR INSERT WITH CHECK (true);
