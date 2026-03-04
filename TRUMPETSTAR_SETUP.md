---
title: Trumpetstar Marketing Automation - SQL Setup
date: 2026-02-24
author: Valentin / Trumpetstar
---

# Datenbank-Setup Script

## Übersicht
Dieses SQL-Script erstellt alle Tabellen für das Marketing Automation System.

---

## 1. Lead Segmente

```sql
CREATE TABLE IF NOT EXISTS lead_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  characteristics jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Seed-Daten:**
- adult: Erwachsene Anfänger/Wiedereinsteiger
- parent: Eltern + Kind (6-14)
- teacher: Lehrer/Dirigent/Bläserklasse

---

## 2. Leads

```sql
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
```

---

## 3. Email Sequences

```sql
CREATE TABLE IF NOT EXISTS email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  segment_id uuid REFERENCES lead_segments(id),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

---

## 4. Email Templates

```sql
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
```

---

## 5. Lead Email Logs

```sql
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
```

---

## 6. Lead Activities

```sql
CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  activity_type text NOT NULL,
  activity_data jsonb,
  score_value integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
```

---

## 7. Bot Decisions

```sql
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
```

---

## 8. Email Queue

```sql
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  template_id uuid REFERENCES email_templates(id),
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
```

---

## RLS Policies

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_read" ON leads FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_read" ON email_sequences FOR SELECT USING (true);
CREATE POLICY "allow_read" ON email_templates FOR SELECT USING (true);
CREATE POLICY "allow_read" ON lead_email_logs FOR SELECT USING (true);
```

---

**Hinweis:** Führe dieses Script in Lovable → Supabase → SQL Editor aus.

**Support:** Bei Fragen Valentin kontaktieren (valentin@trumpetstar.com)
