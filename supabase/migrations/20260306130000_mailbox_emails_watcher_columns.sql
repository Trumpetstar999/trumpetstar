-- Fehlende Spalten für Valentin Mail-Watcher hinzufügen
ALTER TABLE mailbox_emails
  ADD COLUMN IF NOT EXISTS imap_uid   integer UNIQUE,
  ADD COLUMN IF NOT EXISTS ai_draft   text,
  ADD COLUMN IF NOT EXISTS ai_draft_at timestamptz;

-- INSERT-Policy für den Watcher (anon key vom VPS)
DROP POLICY IF EXISTS "watcher_insert" ON mailbox_emails;
CREATE POLICY "watcher_insert" ON mailbox_emails
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "watcher_update" ON mailbox_emails;
CREATE POLICY "watcher_update" ON mailbox_emails
  FOR UPDATE USING (true);
