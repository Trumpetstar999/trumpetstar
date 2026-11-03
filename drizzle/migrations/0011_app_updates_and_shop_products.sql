CREATE TABLE public.app_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  title_i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  body_i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  link text
);
GRANT SELECT ON public.app_updates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_updates TO authenticated;
GRANT ALL ON public.app_updates TO service_role;
ALTER TABLE public.app_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads updates" ON public.app_updates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage updates" ON public.app_updates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.app_update_reads (
  user_id uuid NOT NULL,
  update_id uuid NOT NULL REFERENCES public.app_updates(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, update_id)
);
GRANT SELECT, INSERT, DELETE ON public.app_update_reads TO authenticated;
GRANT ALL ON public.app_update_reads TO service_role;
ALTER TABLE public.app_update_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own reads select" ON public.app_update_reads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own reads insert" ON public.app_update_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own reads delete" ON public.app_update_reads FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.shop_products (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric,
  currency text NOT NULL DEFAULT 'EUR',
  created_at timestamptz NOT NULL DEFAULT now(),
  image_url text,
  order_url text NOT NULL,
  is_new boolean NOT NULL DEFAULT false,
  sort_override integer,
  visible boolean NOT NULL DEFAULT true,
  synced_at timestamptz
);
GRANT SELECT ON public.shop_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shop_products TO authenticated;
GRANT ALL ON public.shop_products TO service_role;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads visible products" ON public.shop_products FOR SELECT TO anon, authenticated
  USING (visible OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage products" ON public.shop_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));