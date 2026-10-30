ALTER TABLE public.app_welcome_vouchers
  ADD COLUMN IF NOT EXISTS reminder_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_message_id text,
  ADD COLUMN IF NOT EXISTS reminder_error text,
  ADD COLUMN IF NOT EXISTS reminder_claim_id uuid,
  ADD COLUMN IF NOT EXISTS reminder_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_attempts integer NOT NULL DEFAULT 0;

ALTER TABLE public.app_welcome_vouchers DROP CONSTRAINT IF EXISTS app_welcome_vouchers_reminder_status_check;
ALTER TABLE public.app_welcome_vouchers ADD CONSTRAINT app_welcome_vouchers_reminder_status_check
  CHECK (reminder_status IN ('pending','checking','sending','sent','failed','uncertain','skipped'));

CREATE INDEX IF NOT EXISTS app_welcome_vouchers_reminder_due_idx
  ON public.app_welcome_vouchers (expires_at) WHERE status = 'sent' AND reminder_status IN ('pending','failed','checking');

-- Single-use run tokens minted by the scheduler inside the database; no long-lived credential exists.
CREATE TABLE IF NOT EXISTS public.welcome_reminder_run_tokens (
  token text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.welcome_reminder_run_tokens TO service_role;
REVOKE ALL ON public.welcome_reminder_run_tokens FROM anon, authenticated;
ALTER TABLE public.welcome_reminder_run_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_welcome_reminder_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ok boolean;
BEGIN
  DELETE FROM public.welcome_reminder_run_tokens WHERE created_at < now() - interval '10 minutes';
  DELETE FROM public.welcome_reminder_run_tokens
   WHERE token = p_token AND length(p_token) >= 64 AND created_at >= now() - interval '10 minutes'
  RETURNING true INTO v_ok;
  RETURN coalesce(v_ok, false);
END;
$$;
REVOKE ALL ON FUNCTION public.consume_welcome_reminder_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_welcome_reminder_token(text) TO service_role;