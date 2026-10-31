CREATE TABLE public.purchase_welcome_deliveries (
  order_id text PRIMARY KEY,
  status text NOT NULL DEFAULT 'sending' CHECK (status IN ('sending','sent','uncertain','skipped')),
  email_log_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
GRANT ALL ON public.purchase_welcome_deliveries TO service_role;
REVOKE ALL ON public.purchase_welcome_deliveries FROM anon, authenticated;
ALTER TABLE public.purchase_welcome_deliveries ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.purchase_welcome_deliveries IS 'Service-only atomic per-order purchase welcome claim; uncertain sends must never auto-retry.';