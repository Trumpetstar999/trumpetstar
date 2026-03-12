
## Analyse

### Was existiert in ClawBot Command:
1. **Leads & CRM** (`LeadsTab.tsx`) – Kanban/Tabellenansicht der `leads`-Tabelle, Lead-Detailmodal, Aktivitäten aus `lead_activities`
2. **E-Mail Automationen** (`MarketingHub.tsx`) mit 7 Sub-Tabs:
   - `FlowsTab` – E-Mail-Flow-Visualisierung pro Lead (aus `leads` + `email_log`)
   - `SequencesTab` – Sequenz-CRUD aus `email_sequences` + `email_sequence_steps`
   - `TemplatesTab` – Template-CRUD aus `email_templates` (erweitert gegenüber bestehendem `EmailTemplateManager`)
   - `EmailLogTab` – Log + Test-E-Mail aus `email_log`
   - `QueueTab` – aus `email_queue`
   - `SegmentsTab` – aus `lead_segments`
3. **SEO Center** (`SeoCenter.tsx`) mit 4 Sub-Tabs:
   - `KeywordMap` – CRUD aus `seo_content_items`
   - `ContentPlan` – Kalenderansicht aus `seo_content_items`
   - `ArticleOS` – Artikel-Outline-Editor mit Quality Checklist
   - `LinkTasks` – aus `seo_link_tasks`
4. **Postfach** (`Mailbox.tsx`) – aus `mailbox_emails`, Compose via `send-email` Edge Function, Sync via `fetch-emails` Edge Function

### Was in TrumpetStar angepasst werden muss:
- `useRealtimeTable` Hook existiert nicht → muss neu erstellt werden
- Tabellen `email_sequences`, `email_sequence_steps`, `email_log`, `email_queue`, `lead_segments`, `seo_content_items`, `seo_link_tasks`, `mailbox_emails` existieren noch nicht → brauchen DB-Migration
- `lead_activities` fehlt auch
- `AdminSidebar` bekommt 4 neue Einträge
- `AdminPage.tsx` bekommt 4 neue Tab-Cases
- `AdminTab`-Type muss erweitert werden
- ClawBot-Referenzen wie `assignee: "ClawBot"` → `assignee: "Valentin"` anpassen
- `send-email` Edge Function muss erstellt werden (für Compose im Postfach)
- `fetch-emails` Edge Function muss erstellt werden (für SMTP-Sync ins Postfach)
- Bestehender `EmailTemplateManager` bleibt für Auth-Templates, neuer `MarketingHub` für Marketing-Templates – sie teilen sich die `email_templates`-Tabelle aber mit erweiterten Feldern

### Verknüpfung mit bestehendem System:
- `leads`-Tabelle existiert bereits → `LeadsTab` liest direkt daraus, aber das existierende Schema hat kein `name`, `phone`, `stage`, `score`-Feld – diese Felder müssen mit einer Migration hinzugefügt werden
- `capture-lead` schreibt bereits in `leads` → CRM-Erweiterung der Tabelle muss rückwärtskompatibel sein (nullable columns)

---

## Plan

### 1. Datenbank-Migration
Neue Spalten zur `leads`-Tabelle (nullable, rückwärtskompatibel):
```sql
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS stage text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS product_interest text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assignee text DEFAULT 'Valentin',
  ADD COLUMN IF NOT EXISTS lifetime_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activity_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;
```

Neue Tabellen:
```sql
-- CRM Activity Log
CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text,
  metadata jsonb,
  performed_by text,
  created_at timestamptz DEFAULT now()
);

-- Email Automation
CREATE TABLE public.lead_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  characteristics jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL DEFAULT 'new_lead',
  is_active boolean NOT NULL DEFAULT true,
  segment_id uuid REFERENCES public.lead_segments(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.email_sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  template_id uuid,
  delay_days integer DEFAULT 0,
  delay_hours integer DEFAULT 0,
  condition_type text DEFAULT 'always',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  recipient_name text,
  template_id uuid,
  sequence_id uuid,
  subject text NOT NULL,
  status text DEFAULT 'queued',
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  template_id uuid,
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- SEO
CREATE TABLE public.seo_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  cluster text DEFAULT '',
  keyword text DEFAULT '',
  llm_prompt text DEFAULT '',
  intent text DEFAULT 'informational',
  target_url text DEFAULT '',
  content_type text DEFAULT 'article',
  status text DEFAULT 'idea',
  priority text DEFAULT 'medium',
  outline text DEFAULT '',
  schema_type text DEFAULT '',
  cta_target text DEFAULT '',
  internal_links text[] DEFAULT '{}',
  assets jsonb,
  publish_date date,
  quality_score integer DEFAULT 0,
  quality_checks jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.seo_link_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_url text NOT NULL,
  to_url text NOT NULL,
  anchor_text text DEFAULT '',
  reason text DEFAULT '',
  status text DEFAULT 'todo',
  content_item_id uuid REFERENCES public.seo_content_items(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Mailbox
CREATE TABLE public.mailbox_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text UNIQUE,
  from_name text DEFAULT '',
  from_email text NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body_text text,
  body_html text,
  snippet text,
  folder text DEFAULT 'inbox',
  is_read boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  has_attachments boolean DEFAULT false,
  received_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

RLS-Policies: Alle neuen Tabellen bekommen Admin-only-Zugriff (außer `lead_activities` → Admin + Insert für Auth-User auf eigene Leads).

### 2. Edge Functions
- `send-email` – Neue Funktion, sendet via SMTP (nodemailer wie `capture-lead`) an beliebige Empfänger
- `fetch-emails` – Neue Funktion, liest E-Mails via IMAP/SMTP (world4you IMAP) und speichert sie in `mailbox_emails`

### 3. Neuer Hook
`src/hooks/useRealtimeTable.ts` – Portiert 1:1 von ClawBot Command

### 4. Neue Admin-Komponenten
Alle Dateien werden angepasst an TrumpetStar-Design (heller Admin-Hintergrund, `admin.css`-Stildatei):

```text
src/components/admin/
├── LeadsCRMPanel.tsx         (aus LeadsTab, adaptiert)
├── EmailAutomationsPanel.tsx  (aus MarketingHub mit allen 6 Tabs)
│   ├── marketing/FlowsTab.tsx
│   ├── marketing/SequencesTab.tsx
│   ├── marketing/TemplatesTab.tsx (Marketing-Templates, getrennt von Auth-Templates)
│   ├── marketing/EmailLogTab.tsx
│   ├── marketing/QueueTab.tsx
│   └── marketing/SegmentsTab.tsx
├── SeoCenterPanel.tsx        (aus SeoCenter)
│   ├── seo/KeywordMap.tsx
│   ├── seo/ContentPlan.tsx
│   ├── seo/ArticleOS.tsx
│   └── seo/LinkTasks.tsx
└── MailboxPanel.tsx           (aus Mailbox)
```

### 5. AdminSidebar erweitern
4 neue Einträge in `menuItems`:
- `leads` → "Leads & CRM" (Target-Icon)
- `marketing` → "E-Mail Automationen" (GitBranch-Icon)
- `seo` → "SEO Center" (Search-Icon)
- `mailbox` → "Postfach" (Inbox-Icon)

### 6. AdminPage.tsx erweitern
- `AdminTab`-Type: 4 neue Werte hinzufügen
- 4 neue Import-Statements
- 4 neue `{activeTab === '...' && <.../>}`-Blöcke
- `getPageTitle()` / `getPageDescription()` erweitern

### Anpassungen gegenüber ClawBot Command
| Was | Änderung |
|---|---|
| `assignee: "ClawBot"` | `assignee: "Valentin"` |
| Dark-Theme-Styles | Admin-CSS (helle Backgrounds) |
| `lead_segments`-Abhängigkeit in SequencesTab | Graceful fallback wenn leer |
| `sync-webinarjam` Button | Ausgeblendet (nicht relevant) |
| `fetch-emails` Edge Function | Implementiert mit IMAP world4you |
