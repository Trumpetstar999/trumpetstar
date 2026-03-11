-- Create landing_page_views table to track landingpage visits
CREATE TABLE public.landing_page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  path TEXT NOT NULL DEFAULT '/',
  referrer TEXT,
  user_agent TEXT,
  language TEXT
);

ALTER TABLE public.landing_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert landing page views"
  ON public.landing_page_views
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view landing page views"
  ON public.landing_page_views
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_landing_page_views_visited_at ON public.landing_page_views(visited_at);