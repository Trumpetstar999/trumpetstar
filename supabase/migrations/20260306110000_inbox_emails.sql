-- Inbox Emails: Valentin Mail-Watcher speichert hier eingehende Mails + AI-Entwürfe
CREATE TABLE IF NOT EXISTS inbox_emails (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imap_uid    integer NOT NULL,
  from_raw    text NOT NULL,
  subject     text NOT NULL,
  body        text,
  received_at timestamptz NOT NULL DEFAULT now(),
  draft_body  text,
  draft_at    timestamptz,
  status      text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'draft_ready', 'sent', 'archived')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index für schnelle UID-Lookups
CREATE UNIQUE INDEX IF NOT EXISTS inbox_emails_imap_uid_idx ON inbox_emails (imap_uid);

-- RLS aktivieren
ALTER TABLE inbox_emails ENABLE ROW LEVEL SECURITY;

-- Watcher darf schreiben (anon key, vertrauenswürdiger Server)
CREATE POLICY "watcher_insert" ON inbox_emails
  FOR INSERT WITH CHECK (true);

CREATE POLICY "watcher_update" ON inbox_emails
  FOR UPDATE USING (true);

-- Admin darf lesen (authentifiziert)
CREATE POLICY "admin_select" ON inbox_emails
  FOR SELECT USING (auth.role() = 'authenticated');
