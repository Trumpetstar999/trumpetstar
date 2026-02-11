
-- Add columns to existing digistore24_products table
ALTER TABLE public.digistore24_products
  ADD COLUMN IF NOT EXISTS raw_payload_json jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS checkout_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz DEFAULT now();

-- Create import logs table
CREATE TABLE public.digistore24_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  products_total integer DEFAULT 0,
  products_created integer DEFAULT 0,
  products_updated integer DEFAULT 0,
  error_message text,
  triggered_by uuid
);

ALTER TABLE public.digistore24_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage import logs"
  ON public.digistore24_import_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
