
-- Watcher braucht SELECT-Rechte um UPDATEs (ai_draft setzen) zu ermöglichen
-- Supabase: UPDATE-Policy benötigt SELECT auf der Zeile
DROP POLICY IF EXISTS "watcher_select" ON mailbox_emails;
CREATE POLICY "watcher_select" ON mailbox_emails
  FOR SELECT USING (true);
