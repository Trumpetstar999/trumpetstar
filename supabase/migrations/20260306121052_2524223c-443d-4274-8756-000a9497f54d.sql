
-- Create shipments table for tracking physical product orders from Digistore24
CREATE TABLE IF NOT EXISTS public.digistore24_shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Order info from Digistore24
  transaction_id text NOT NULL,
  order_id text NOT NULL,
  -- Customer info
  customer_name text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  -- Product info
  product_name text NOT NULL DEFAULT '',
  product_id text,
  quantity integer NOT NULL DEFAULT 1,
  -- Shipping address
  address_street text,
  address_city text,
  address_zip text,
  address_country text,
  address_full text,
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'cancelled')),
  shipped_at timestamp with time zone,
  shipped_by text,
  tracking_code text,
  notes text,
  -- Raw data from Digistore24
  raw_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.digistore24_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage shipments"
  ON public.digistore24_shipments
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_digistore24_shipments_updated_at
  BEFORE UPDATE ON public.digistore24_shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for quick lookup of pending shipments
CREATE INDEX idx_digistore24_shipments_status ON public.digistore24_shipments(status);
CREATE INDEX idx_digistore24_shipments_transaction_id ON public.digistore24_shipments(transaction_id);
