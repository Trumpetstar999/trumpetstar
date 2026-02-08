-- Digistore24 Integration Tables

-- 1. Settings (Admin-konfigurierbar)
CREATE TABLE public.digistore24_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.digistore24_settings (key, value, description) VALUES
  ('app_base_url', 'https://trumpetstar.lovable.app', 'Base URL für Magic Links (änderbar bei Domain-Wechsel)'),
  ('ipn_secret', '', 'Shared Secret/Passphrase für IPN-Validierung'),
  ('support_email', 'support@trumpetstar.com', 'Support E-Mail Adresse'),
  ('default_locale', 'de', 'Standard-Sprache (de/en/es)');

-- Enable RLS
ALTER TABLE public.digistore24_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage digistore24 settings"
ON public.digistore24_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Product Mapping (Digistore → App Entitlements)
CREATE TYPE public.digistore24_access_policy AS ENUM ('IMMEDIATE_REVOKE', 'REVOKE_AT_PERIOD_END');

CREATE TABLE public.digistore24_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digistore_product_id text NOT NULL UNIQUE,
  name text NOT NULL,
  entitlement_key text NOT NULL,
  access_policy digistore24_access_policy NOT NULL DEFAULT 'REVOKE_AT_PERIOD_END',
  plan_key text DEFAULT 'FREE',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.digistore24_products ENABLE ROW LEVEL SECURITY;

-- Admins can manage, everyone can read active products
CREATE POLICY "Admins can manage digistore24 products"
ON public.digistore24_products FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active digistore24 products"
ON public.digistore24_products FOR SELECT
USING (is_active = true);

-- 3. Subscriptions (Abo-Status pro User/Order)
CREATE TYPE public.digistore24_subscription_status AS ENUM ('active', 'cancelled', 'refunded', 'chargeback', 'expired');

CREATE TABLE public.digistore24_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digistore_order_id text NOT NULL,
  digistore_subscription_id text,
  digistore_product_id text NOT NULL,
  status digistore24_subscription_status NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(digistore_order_id)
);

-- Enable RLS
ALTER TABLE public.digistore24_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view own, admins can manage all
CREATE POLICY "Users can view own digistore24 subscriptions"
ON public.digistore24_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all digistore24 subscriptions"
ON public.digistore24_subscriptions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Entitlements (Zugriffsrechte pro User)
CREATE TABLE public.digistore24_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_key text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  valid_until timestamptz,
  source text NOT NULL DEFAULT 'digistore24',
  subscription_id uuid REFERENCES public.digistore24_subscriptions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entitlement_key, source)
);

-- Enable RLS
ALTER TABLE public.digistore24_entitlements ENABLE ROW LEVEL SECURITY;

-- Users can view own, admins can manage all
CREATE POLICY "Users can view own digistore24 entitlements"
ON public.digistore24_entitlements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all digistore24 entitlements"
ON public.digistore24_entitlements FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. IPN Events (Audit Log)
CREATE TYPE public.digistore24_ipn_status AS ENUM ('received', 'processing', 'processed', 'rejected', 'error');
CREATE TYPE public.digistore24_event_type AS ENUM ('PURCHASE', 'RENEWAL', 'CANCELLATION', 'REFUND', 'CHARGEBACK', 'UNKNOWN');

CREATE TABLE public.digistore24_ipn_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text NOT NULL UNIQUE,
  event_type digistore24_event_type NOT NULL DEFAULT 'UNKNOWN',
  order_id text,
  subscription_id text,
  product_id text,
  email text,
  raw_payload jsonb NOT NULL,
  normalized_payload jsonb,
  status digistore24_ipn_status NOT NULL DEFAULT 'received',
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_digistore24_ipn_events_email ON public.digistore24_ipn_events(email);
CREATE INDEX idx_digistore24_ipn_events_order_id ON public.digistore24_ipn_events(order_id);
CREATE INDEX idx_digistore24_ipn_events_status ON public.digistore24_ipn_events(status);
CREATE INDEX idx_digistore24_ipn_events_received_at ON public.digistore24_ipn_events(received_at DESC);

-- Enable RLS
ALTER TABLE public.digistore24_ipn_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage IPN events
CREATE POLICY "Admins can manage digistore24 ipn events"
ON public.digistore24_ipn_events FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_digistore24_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_digistore24_settings_updated_at
  BEFORE UPDATE ON public.digistore24_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_digistore24_updated_at();

CREATE TRIGGER update_digistore24_products_updated_at
  BEFORE UPDATE ON public.digistore24_products
  FOR EACH ROW EXECUTE FUNCTION public.update_digistore24_updated_at();

CREATE TRIGGER update_digistore24_subscriptions_updated_at
  BEFORE UPDATE ON public.digistore24_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_digistore24_updated_at();

CREATE TRIGGER update_digistore24_entitlements_updated_at
  BEFORE UPDATE ON public.digistore24_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_digistore24_updated_at();

CREATE TRIGGER update_digistore24_ipn_events_updated_at
  BEFORE UPDATE ON public.digistore24_ipn_events
  FOR EACH ROW EXECUTE FUNCTION public.update_digistore24_updated_at();