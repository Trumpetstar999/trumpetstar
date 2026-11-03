CREATE TABLE public.beginner_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order integer NOT NULL DEFAULT 0,
  title_i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  video_url text,
  playalong_url text,
  cover_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beginner_lessons TO authenticated;
GRANT ALL ON public.beginner_lessons TO service_role;
ALTER TABLE public.beginner_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read active lessons" ON public.beginner_lessons FOR SELECT TO authenticated
  USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage lessons" ON public.beginner_lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));