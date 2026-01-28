-- ============================================
-- MULTI-LANGUAGE SUPPORT MIGRATION
-- ============================================

-- 1) Add language column to videos table
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'de' CHECK (language IN ('de', 'en', 'es'));

-- 2) Add localized title/description columns to videos
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_es TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_es TEXT;

-- 3) Add localized columns to levels
ALTER TABLE public.levels 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'de' CHECK (language IN ('de', 'en', 'es')),
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_es TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_es TEXT;

-- 4) Add localized columns to pdf_documents
ALTER TABLE public.pdf_documents 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'de' CHECK (language IN ('de', 'en', 'es')),
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_es TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_es TEXT;

-- 5) Add localized columns to musicxml_documents
ALTER TABLE public.musicxml_documents 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'de' CHECK (language IN ('de', 'en', 'es')),
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_es TEXT,
ADD COLUMN IF NOT EXISTS category_en TEXT,
ADD COLUMN IF NOT EXISTS category_es TEXT;

-- 6) Add localized columns to sections
ALTER TABLE public.sections 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_es TEXT;

-- 7) Add localized columns to knowledge_sources
ALTER TABLE public.knowledge_sources 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_es TEXT,
ADD COLUMN IF NOT EXISTS content_en TEXT,
ADD COLUMN IF NOT EXISTS content_es TEXT;

-- 8) Add localized columns to knowledge_chunks
ALTER TABLE public.knowledge_chunks 
ADD COLUMN IF NOT EXISTS chunk_text_en TEXT,
ADD COLUMN IF NOT EXISTS chunk_text_es TEXT,
ADD COLUMN IF NOT EXISTS embedding_json_en JSONB,
ADD COLUMN IF NOT EXISTS embedding_json_es JSONB;

-- 9) Add localized columns to repertoire_items
ALTER TABLE public.repertoire_items 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_es TEXT,
ADD COLUMN IF NOT EXISTS notes_en TEXT,
ADD COLUMN IF NOT EXISTS notes_es TEXT,
ADD COLUMN IF NOT EXISTS goal_en TEXT,
ADD COLUMN IF NOT EXISTS goal_es TEXT,
ADD COLUMN IF NOT EXISTS practice_steps_en TEXT,
ADD COLUMN IF NOT EXISTS practice_steps_es TEXT,
ADD COLUMN IF NOT EXISTS common_pitfalls_en TEXT,
ADD COLUMN IF NOT EXISTS common_pitfalls_es TEXT;

-- 10) Create user_preferences table for language settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  language TEXT DEFAULT 'de' CHECK (language IN ('de', 'en', 'es')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster language filtering
CREATE INDEX IF NOT EXISTS idx_videos_language ON public.videos(language);
CREATE INDEX IF NOT EXISTS idx_levels_language ON public.levels(language);
CREATE INDEX IF NOT EXISTS idx_pdf_documents_language ON public.pdf_documents(language);
CREATE INDEX IF NOT EXISTS idx_musicxml_documents_language ON public.musicxml_documents(language);

-- Trigger for updating updated_at on user_preferences
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();