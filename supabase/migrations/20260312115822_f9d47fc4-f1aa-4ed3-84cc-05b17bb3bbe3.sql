
-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT,
  street TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'AT' CHECK (country IN ('AT', 'DE')),
  uid_number TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage customers" ON public.customers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_gross NUMERIC(10,2) NOT NULL,
  vat_rate_at NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  vat_rate_de NUMERIC(5,2) NOT NULL DEFAULT 7.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- INVOICE SEQUENCES
-- ============================================================
CREATE TABLE public.invoice_sequences (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage invoice sequences" ON public.invoice_sequences FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.next_invoice_number(p_year INTEGER)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_next INTEGER;
BEGIN
  INSERT INTO public.invoice_sequences (year, last_number) VALUES (p_year, 1)
  ON CONFLICT (year) DO UPDATE SET last_number = invoice_sequences.last_number + 1
  RETURNING last_number INTO v_next;
  RETURN p_year::TEXT || '-' || LPAD(v_next::TEXT, 3, '0');
END;
$$;

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  country TEXT NOT NULL CHECK (country IN ('AT', 'DE')),
  vat_rate NUMERIC(5,2) NOT NULL,
  subtotal_net NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_gross NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_invoice_due_date()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.due_date IS NULL THEN NEW.due_date := NEW.invoice_date + INTERVAL '14 days'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_set_invoice_due_date BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_invoice_due_date();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- INVOICE ITEMS
-- ============================================================
CREATE TABLE public.invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  description TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'Stück',
  unit_price_gross NUMERIC(10,2) NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  line_total_gross NUMERIC(10,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage invoice items" ON public.invoice_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id),
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage inventory" ON public.inventory FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- INVENTORY MOVEMENTS
-- ============================================================
CREATE TABLE public.inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_change INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'correction', 'return')),
  reason TEXT NOT NULL DEFAULT '',
  reference_type TEXT,
  reference_id TEXT,
  created_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage inventory movements" ON public.inventory_movements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- STOCK FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_stock(p_product_id UUID, p_quantity INTEGER, p_reason TEXT DEFAULT 'Wareneingang')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.inventory (product_id, quantity_on_hand)
  VALUES (p_product_id, p_quantity)
  ON CONFLICT (product_id) DO UPDATE SET quantity_on_hand = inventory.quantity_on_hand + p_quantity, updated_at = now();
  INSERT INTO public.inventory_movements (product_id, quantity_change, movement_type, reason) VALUES (p_product_id, p_quantity, 'in', p_reason);
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_invoice(p_invoice_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_item RECORD;
BEGIN
  UPDATE public.invoices SET status = 'sent', updated_at = now() WHERE id = p_invoice_id AND status = 'draft';
  FOR v_item IN SELECT ii.product_id, ii.quantity::INTEGER FROM public.invoice_items ii WHERE ii.invoice_id = p_invoice_id AND ii.product_id IS NOT NULL LOOP
    UPDATE public.inventory SET quantity_on_hand = GREATEST(0, quantity_on_hand - v_item.quantity), updated_at = now() WHERE product_id = v_item.product_id;
    INSERT INTO public.inventory_movements (product_id, quantity_change, movement_type, reason, reference_type, reference_id)
    VALUES (v_item.product_id, -v_item.quantity, 'out', 'Rechnung finalisiert', 'invoice', p_invoice_id::TEXT);
  END LOOP;
END;
$$;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
