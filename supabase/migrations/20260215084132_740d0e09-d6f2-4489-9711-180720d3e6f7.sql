
-- Table: digistore24_customers
CREATE TABLE public.digistore24_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digistore_customer_id text UNIQUE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  company text,
  country text,
  phone text,
  total_purchases integer NOT NULL DEFAULT 0,
  total_revenue numeric(10,2) NOT NULL DEFAULT 0,
  first_purchase_at timestamptz,
  last_purchase_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.digistore24_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage digistore24 customers"
  ON public.digistore24_customers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_digistore24_customers_updated_at
  BEFORE UPDATE ON public.digistore24_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: digistore24_transactions
CREATE TABLE public.digistore24_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digistore_transaction_id text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.digistore24_customers(id) ON DELETE SET NULL,
  product_id text,
  product_name text,
  amount numeric(10,2),
  currency text NOT NULL DEFAULT 'EUR',
  status text,
  payment_method text,
  pay_date timestamptz,
  refund_date timestamptz,
  raw_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.digistore24_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage digistore24 transactions"
  ON public.digistore24_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_digistore24_transactions_updated_at
  BEFORE UPDATE ON public.digistore24_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: digistore24_sync_log
CREATE TABLE public.digistore24_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  records_imported integer NOT NULL DEFAULT 0,
  records_updated integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.digistore24_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage digistore24 sync log"
  ON public.digistore24_sync_log FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
