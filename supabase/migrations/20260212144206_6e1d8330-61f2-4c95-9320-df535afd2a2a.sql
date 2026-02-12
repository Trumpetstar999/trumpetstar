
-- Create drum_beats table
CREATE TABLE public.drum_beats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text,
  native_bpm integer,
  time_signature_top integer,
  time_signature_bottom integer,
  file_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.drum_beats ENABLE ROW LEVEL SECURITY;

-- Anyone can view active beats
CREATE POLICY "Anyone can view active drum beats"
ON public.drum_beats
FOR SELECT
USING (is_active = true);

-- Admins can manage all beats
CREATE POLICY "Admins can manage drum beats"
ON public.drum_beats
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for drum beat MP3s
INSERT INTO storage.buckets (id, name, public)
VALUES ('drum-beats', 'drum-beats', true);

-- Storage policies for drum-beats bucket
CREATE POLICY "Anyone can view drum beat files"
ON storage.objects FOR SELECT
USING (bucket_id = 'drum-beats');

CREATE POLICY "Admins can upload drum beat files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'drum-beats' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update drum beat files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'drum-beats' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete drum beat files"
ON storage.objects FOR DELETE
USING (bucket_id = 'drum-beats' AND has_role(auth.uid(), 'admin'::app_role));

-- Insert feature flag for metronome menu
INSERT INTO public.feature_flags (key, display_name, description, is_enabled, sort_order)
VALUES ('menu_metronome', 'Metronom', 'Metronom & DrumMachine Seite im Menü anzeigen', true, 50);
