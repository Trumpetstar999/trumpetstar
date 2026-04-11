
CREATE TABLE public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'audio')),
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  audio_id UUID REFERENCES public.audio_files(id) ON DELETE SET NULL,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active QR codes
CREATE POLICY "Authenticated users can read active qr_codes"
  ON public.qr_codes FOR SELECT TO authenticated
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage qr_codes"
  ON public.qr_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_qr_codes_code ON public.qr_codes (code);
