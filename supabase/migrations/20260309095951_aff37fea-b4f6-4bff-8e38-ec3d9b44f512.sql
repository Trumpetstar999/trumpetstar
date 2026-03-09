
-- Drop all existing policies on email_log
DROP POLICY IF EXISTS "Allow public read access to email_log" ON public.email_log;
DROP POLICY IF EXISTS "Allow anon read" ON public.email_log;
DROP POLICY IF EXISTS "Allow public select" ON public.email_log;
DROP POLICY IF EXISTS "email_log_select_policy" ON public.email_log;
DROP POLICY IF EXISTS "Allow insert for service role" ON public.email_log;
DROP POLICY IF EXISTS "Allow update for service role" ON public.email_log;
DROP POLICY IF EXISTS "email_log_insert_policy" ON public.email_log;
DROP POLICY IF EXISTS "email_log_update_policy" ON public.email_log;

-- Ensure RLS is enabled
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read email logs
CREATE POLICY "admin_select_email_log"
ON public.email_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert email logs (edge functions use service role key which bypasses RLS)
CREATE POLICY "admin_insert_email_log"
ON public.email_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update email logs
CREATE POLICY "admin_update_email_log"
ON public.email_log
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
