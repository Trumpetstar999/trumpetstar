CREATE TABLE public.brevo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_sync_enabled boolean NOT NULL DEFAULT true,
  list_id_de integer,
  list_id_en integer,
  list_id_es integer,
  list_id_sl integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brevo_settings TO authenticated;
GRANT ALL ON public.brevo_settings TO service_role;
ALTER TABLE public.brevo_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage brevo settings" ON public.brevo_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_brevo_settings_updated_at BEFORE UPDATE ON public.brevo_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.brevo_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  synced_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  last_error text
);

GRANT SELECT ON public.brevo_sync_log TO authenticated;
GRANT ALL ON public.brevo_sync_log TO service_role;
ALTER TABLE public.brevo_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read brevo sync log" ON public.brevo_sync_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.brevo_contact_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  brevo_contact_id bigint,
  list_id integer,
  source text,
  status text NOT NULL DEFAULT 'synced',
  last_error text,
  last_synced_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.brevo_contact_state TO authenticated;
GRANT ALL ON public.brevo_contact_state TO service_role;
ALTER TABLE public.brevo_contact_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read brevo contact state" ON public.brevo_contact_state
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.brevo_settings (auto_sync_enabled) VALUES (true);