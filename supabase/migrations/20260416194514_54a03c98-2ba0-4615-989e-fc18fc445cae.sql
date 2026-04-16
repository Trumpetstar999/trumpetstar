
-- Remove the overly permissive watcher_* policies on mailbox_emails
DROP POLICY IF EXISTS "watcher_select" ON public.mailbox_emails;
DROP POLICY IF EXISTS "watcher_insert" ON public.mailbox_emails;
DROP POLICY IF EXISTS "watcher_update" ON public.mailbox_emails;
DROP POLICY IF EXISTS "watcher_delete" ON public.mailbox_emails;

-- Ensure RLS is enabled
ALTER TABLE public.mailbox_emails ENABLE ROW LEVEL SECURITY;

-- Admin-only access (service role bypasses RLS automatically for edge functions)
CREATE POLICY "Admins can view mailbox emails"
  ON public.mailbox_emails
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert mailbox emails"
  ON public.mailbox_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update mailbox emails"
  ON public.mailbox_emails
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete mailbox emails"
  ON public.mailbox_emails
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
