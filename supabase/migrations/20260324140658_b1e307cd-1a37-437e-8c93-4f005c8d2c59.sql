
-- Audio levels (separate from video levels)
CREATE TABLE public.audio_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audio files
CREATE TABLE public.audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_url TEXT NOT NULL,
  original_filename TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL,
  duration_seconds NUMERIC,
  level_id UUID REFERENCES public.audio_levels(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audio level items (ordering)
CREATE TABLE public.audio_level_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES public.audio_levels(id) ON DELETE CASCADE,
  audio_id UUID NOT NULL UNIQUE REFERENCES public.audio_files(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audio_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_level_items ENABLE ROW LEVEL SECURITY;

-- Public SELECT for all three tables
CREATE POLICY "Audio levels are readable by everyone"
  ON public.audio_levels FOR SELECT USING (true);

CREATE POLICY "Audio files are readable by everyone"
  ON public.audio_files FOR SELECT USING (true);

CREATE POLICY "Audio level items are readable by everyone"
  ON public.audio_level_items FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can manage audio levels"
  ON public.audio_levels FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage audio files"
  ON public.audio_files FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage audio level items"
  ON public.audio_level_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert feature flag for audio tab
INSERT INTO public.feature_flags (key, display_name, is_enabled, sort_order)
VALUES ('menu_audios', 'Audios (Playback)', true, 11)
ON CONFLICT (key) DO NOTHING;
