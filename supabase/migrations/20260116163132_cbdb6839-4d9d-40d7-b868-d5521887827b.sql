-- Create pdf_documents table
CREATE TABLE public.pdf_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID REFERENCES public.levels(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  plan_required TEXT NOT NULL DEFAULT 'BASIC',
  pdf_file_url TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pdf_audio_tracks table (supports 200+ tracks per PDF)
CREATE TABLE public.pdf_audio_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_document_id UUID NOT NULL REFERENCES public.pdf_documents(id) ON DELETE CASCADE,
  level_id UUID REFERENCES public.levels(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration INTEGER, -- in seconds
  page_number INTEGER NOT NULL, -- exactly one page per track
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_page_number CHECK (page_number >= 1)
);

-- Create pdf_user_annotations table (per user, per page)
CREATE TABLE public.pdf_user_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pdf_document_id UUID NOT NULL REFERENCES public.pdf_documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  annotations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pdf_document_id, page_number)
);

-- Create pdf_user_state table (user's reading state per PDF)
CREATE TABLE public.pdf_user_state (
  user_id UUID NOT NULL,
  pdf_document_id UUID NOT NULL REFERENCES public.pdf_documents(id) ON DELETE CASCADE,
  last_page INTEGER NOT NULL DEFAULT 1,
  last_zoom FLOAT NOT NULL DEFAULT 1.0,
  last_audio_track_id UUID REFERENCES public.pdf_audio_tracks(id) ON DELETE SET NULL,
  last_playback_rate FLOAT NOT NULL DEFAULT 1.0 CHECK (last_playback_rate >= 0.40 AND last_playback_rate <= 1.20),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pdf_document_id)
);

-- Create indexes for performance (important for 200+ tracks)
CREATE INDEX idx_pdf_audio_tracks_pdf_id ON public.pdf_audio_tracks(pdf_document_id);
CREATE INDEX idx_pdf_audio_tracks_page ON public.pdf_audio_tracks(pdf_document_id, page_number);
CREATE INDEX idx_pdf_audio_tracks_level ON public.pdf_audio_tracks(level_id);
CREATE INDEX idx_pdf_documents_level ON public.pdf_documents(level_id);
CREATE INDEX idx_pdf_user_annotations_user_pdf ON public.pdf_user_annotations(user_id, pdf_document_id);

-- Enable RLS
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_audio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_user_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_user_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_documents (public read for active, admin write)
CREATE POLICY "Anyone can view active PDF documents"
  ON public.pdf_documents FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage PDF documents"
  ON public.pdf_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pdf_audio_tracks (public read, admin write)
CREATE POLICY "Anyone can view audio tracks"
  ON public.pdf_audio_tracks FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage audio tracks"
  ON public.pdf_audio_tracks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pdf_user_annotations (user owns their annotations)
CREATE POLICY "Users can view their own annotations"
  ON public.pdf_user_annotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own annotations"
  ON public.pdf_user_annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations"
  ON public.pdf_user_annotations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations"
  ON public.pdf_user_annotations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for pdf_user_state (user owns their state)
CREATE POLICY "Users can view their own state"
  ON public.pdf_user_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own state"
  ON public.pdf_user_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own state"
  ON public.pdf_user_state FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_pdf_documents_updated_at
  BEFORE UPDATE ON public.pdf_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdf_user_annotations_updated_at
  BEFORE UPDATE ON public.pdf_user_annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdf_user_state_updated_at
  BEFORE UPDATE ON public.pdf_user_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets for PDFs and Audio
INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-documents', 'pdf-documents', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-audio', 'pdf-audio', true);

-- Storage policies for pdf-documents bucket
CREATE POLICY "Public can view PDF documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pdf-documents');

CREATE POLICY "Admins can upload PDF documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pdf-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update PDF documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'pdf-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete PDF documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pdf-documents' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for pdf-audio bucket
CREATE POLICY "Public can view PDF audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pdf-audio');

CREATE POLICY "Admins can upload PDF audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pdf-audio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update PDF audio"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'pdf-audio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete PDF audio"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pdf-audio' AND public.has_role(auth.uid(), 'admin'));