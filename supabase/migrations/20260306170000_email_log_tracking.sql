-- Fix email_log RLS + add tracking RPC functions

-- 1. Allow Edge Functions (and internal services) to INSERT into email_log
--    Service role key auto-bypasses RLS, but anon key fallback also needs access
CREATE POLICY IF NOT EXISTS "Allow insert email_log"
  ON public.email_log
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 2. Allow SELECT for authenticated users (admin dashboard)
CREATE POLICY IF NOT EXISTS "Allow select email_log"
  ON public.email_log
  FOR SELECT
  TO public
  USING (true);

-- 3. Allow UPDATE for tracking (opened_at, clicked_at)
CREATE POLICY IF NOT EXISTS "Allow update email_log"
  ON public.email_log
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- 4. SECURITY DEFINER RPC: insert_email_log (callable from Edge Functions with anon key)
CREATE OR REPLACE FUNCTION public.insert_email_log(
  p_recipient_email text,
  p_subject         text,
  p_recipient_name  text  DEFAULT NULL,
  p_status          text  DEFAULT 'queued',
  p_template_id     uuid  DEFAULT NULL,
  p_sequence_id     uuid  DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.email_log (
    recipient_email, subject, recipient_name, status, template_id, sequence_id
  ) VALUES (
    p_recipient_email, p_subject, p_recipient_name, p_status, p_template_id, p_sequence_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 5. SECURITY DEFINER RPC: mark_email_sent
CREATE OR REPLACE FUNCTION public.mark_email_sent(
  p_id      uuid,
  p_message_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.email_log
  SET status = 'sent', sent_at = now()
  WHERE id = p_id;
END;
$$;

-- 6. SECURITY DEFINER RPC: mark_email_opened (idempotent – only first open counts)
CREATE OR REPLACE FUNCTION public.mark_email_opened(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.email_log
  SET opened_at = now(), status = 'opened'
  WHERE id = p_id
    AND opened_at IS NULL;
END;
$$;

-- 7. SECURITY DEFINER RPC: mark_email_clicked (idempotent)
CREATE OR REPLACE FUNCTION public.mark_email_clicked(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.email_log
  SET clicked_at = now()
  WHERE id = p_id
    AND clicked_at IS NULL;
END;
$$;

-- Grant execute on RPC functions to anon + authenticated
GRANT EXECUTE ON FUNCTION public.insert_email_log TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_email_sent    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_email_opened  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_email_clicked TO anon, authenticated;
