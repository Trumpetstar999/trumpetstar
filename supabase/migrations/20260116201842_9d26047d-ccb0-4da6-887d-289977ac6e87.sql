-- MusicXML Documents Table
CREATE TABLE public.musicxml_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID REFERENCES public.levels(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT,
  plan_required TEXT NOT NULL DEFAULT 'BASIC',
  xml_file_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.musicxml_documents ENABLE ROW LEVEL SECURITY;

-- Everyone can read active documents
CREATE POLICY "Anyone can view active musicxml documents"
ON public.musicxml_documents
FOR SELECT
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage musicxml documents"
ON public.musicxml_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- MusicXML Audio Tracks Table
CREATE TABLE public.musicxml_audio_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  musicxml_document_id UUID NOT NULL REFERENCES public.musicxml_documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration INTEGER,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.musicxml_audio_tracks ENABLE ROW LEVEL SECURITY;

-- Anyone can read audio tracks (document access controlled separately)
CREATE POLICY "Anyone can view musicxml audio tracks"
ON public.musicxml_audio_tracks
FOR SELECT
USING (true);

-- Admins can manage audio tracks
CREATE POLICY "Admins can manage musicxml audio tracks"
ON public.musicxml_audio_tracks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- User state for MusicXML (last position, settings)
CREATE TABLE public.musicxml_user_state (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  musicxml_document_id UUID NOT NULL REFERENCES public.musicxml_documents(id) ON DELETE CASCADE,
  last_bar INTEGER DEFAULT 1,
  last_tempo INTEGER DEFAULT 100,
  is_concert_pitch BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, musicxml_document_id)
);

-- Enable RLS
ALTER TABLE public.musicxml_user_state ENABLE ROW LEVEL SECURITY;

-- Users can manage their own state
CREATE POLICY "Users can manage their own musicxml state"
ON public.musicxml_user_state
FOR ALL
USING (auth.uid() = user_id);

-- User annotations for MusicXML
CREATE TABLE public.musicxml_user_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  musicxml_document_id UUID NOT NULL REFERENCES public.musicxml_documents(id) ON DELETE CASCADE,
  bar_number INTEGER NOT NULL,
  annotation_type TEXT NOT NULL DEFAULT 'note', -- 'note', 'highlight', 'marking'
  content TEXT,
  color TEXT DEFAULT '#FFD700',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.musicxml_user_annotations ENABLE ROW LEVEL SECURITY;

-- Users can manage their own annotations
CREATE POLICY "Users can manage their own musicxml annotations"
ON public.musicxml_user_annotations
FOR ALL
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_musicxml_documents_level ON public.musicxml_documents(level_id);
CREATE INDEX idx_musicxml_documents_active ON public.musicxml_documents(is_active);
CREATE INDEX idx_musicxml_audio_tracks_doc ON public.musicxml_audio_tracks(musicxml_document_id);
CREATE INDEX idx_musicxml_user_state_user ON public.musicxml_user_state(user_id);
CREATE INDEX idx_musicxml_annotations_user_doc ON public.musicxml_user_annotations(user_id, musicxml_document_id);

-- Create storage bucket for MusicXML files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('musicxml-files', 'musicxml-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for MusicXML audio
INSERT INTO storage.buckets (id, name, public) 
VALUES ('musicxml-audio', 'musicxml-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for musicxml-files bucket
CREATE POLICY "Anyone can view musicxml files"
ON storage.objects FOR SELECT
USING (bucket_id = 'musicxml-files');

CREATE POLICY "Admins can upload musicxml files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'musicxml-files' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete musicxml files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'musicxml-files' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Storage policies for musicxml-audio bucket
CREATE POLICY "Anyone can view musicxml audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'musicxml-audio');

CREATE POLICY "Admins can upload musicxml audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'musicxml-audio' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete musicxml audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'musicxml-audio' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);