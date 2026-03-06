
-- Fehlende Spalten für Mailbox-Watcher hinzufügen
ALTER TABLE mailbox_emails
  ADD COLUMN IF NOT EXISTS imap_uid   integer,
  ADD COLUMN IF NOT EXISTS ai_draft   text,
  ADD COLUMN IF NOT EXISTS ai_draft_at timestamptz;

-- Unique constraint auf imap_uid (nur wenn noch nicht vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mailbox_emails_imap_uid_key'
  ) THEN
    ALTER TABLE mailbox_emails ADD CONSTRAINT mailbox_emails_imap_uid_key UNIQUE (imap_uid);
  END IF;
END$$;

-- INSERT/UPDATE Policy für den Mail-Watcher (VPS mit anon key)
DROP POLICY IF EXISTS "watcher_insert" ON mailbox_emails;
CREATE POLICY "watcher_insert" ON mailbox_emails
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "watcher_update" ON mailbox_emails;
CREATE POLICY "watcher_update" ON mailbox_emails
  FOR UPDATE USING (true);
