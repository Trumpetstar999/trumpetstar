CREATE TABLE public.app_welcome_vouchers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL UNIQUE,
 email text NOT NULL,
 language text NOT NULL DEFAULT 'de' CHECK (language IN ('de','en','es','sl')),
 voucher_code text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','voucher_creating','voucher_failed','voucher_uncertain','voucher_created','sending','mail_failed','mail_uncertain','sent','expired')),
 brevo_message_id text,
 error_message text,
 created_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz,
 first_name text,
 is_test boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX app_welcome_vouchers_email_unique ON public.app_welcome_vouchers (lower(email));
CREATE UNIQUE INDEX app_welcome_vouchers_single_test ON public.app_welcome_vouchers (is_test) WHERE is_test;
GRANT ALL ON public.app_welcome_vouchers TO service_role;
REVOKE ALL ON public.app_welcome_vouchers FROM anon, authenticated;
ALTER TABLE public.app_welcome_vouchers ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.app_welcome_vouchers IS 'Service-only one-time welcome delivery ledger. Ambiguous provider outcomes require reconciliation; never reset or delete to resend.';