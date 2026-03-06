
CREATE TABLE IF NOT EXISTS public.knowledge_base_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage knowledge base settings"
  ON public.knowledge_base_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_knowledge_base_settings_updated_at
  BEFORE UPDATE ON public.knowledge_base_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.knowledge_base_settings (key, value)
VALUES (
  'main',
  '{
    "zuletzt_aktualisiert": "2026-03-06",
    "unternehmen": {
      "name": "TrumpetStar",
      "gruender": "Valentin",
      "beschreibung": "Online-Trompetenunterricht für Anfänger bis Fortgeschrittene.",
      "telefon": "",
      "email": "Valentin@trumpetstar.com"
    },
    "produkte": [],
    "faq": [],
    "links": {
      "website": "https://trumpetstar.com"
    }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
