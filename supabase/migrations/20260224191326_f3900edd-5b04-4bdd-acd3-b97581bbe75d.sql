
-- Create leads table for landing page email capture
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'landing',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX idx_leads_email ON public.leads (email);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon (public landing page)
CREATE POLICY "Anyone can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- Only admins can read leads
CREATE POLICY "Admins can read leads"
  ON public.leads FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
