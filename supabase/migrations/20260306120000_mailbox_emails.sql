-- Postfach: Eingehende E-Mails (IMAP) + AI-Entwürfe von Valentin
CREATE TABLE IF NOT EXISTS mailbox_emails (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imap_uid     integer UNIQUE,
  from_email   text NOT NULL,
  from_name    text,
  to_email     text NOT NULL DEFAULT 'valentin@trumpetstar.com',
  subject      text NOT NULL,
  body_text    text,
  body_html    text,
  snippet      text,
  folder       text NOT NULL DEFAULT 'inbox',
  is_read      boolean NOT NULL DEFAULT false,
  is_starred   boolean NOT NULL DEFAULT false,
  is_flagged   boolean NOT NULL DEFAULT false,
  ai_draft     text,
  ai_draft_at  timestamptz,
  received_at  timestamptz DEFAULT now(),
  sent_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mailbox_emails_folder_idx ON mailbox_emails (folder);
CREATE INDEX IF NOT EXISTS mailbox_emails_received_at_idx ON mailbox_emails (received_at DESC);

ALTER TABLE mailbox_emails ENABLE ROW LEVEL SECURITY;

-- Watcher darf schreiben (anon key vom VPS)
CREATE POLICY "watcher_insert" ON mailbox_emails FOR INSERT WITH CHECK (true);
CREATE POLICY "watcher_update" ON mailbox_emails FOR UPDATE USING (true);

-- Admin lesen + löschen
CREATE POLICY "admin_select" ON mailbox_emails FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete" ON mailbox_emails FOR DELETE USING (auth.role() = 'authenticated');
