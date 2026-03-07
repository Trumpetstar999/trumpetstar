-- Drop the existing restrictive language check constraint
ALTER TABLE public.levels DROP CONSTRAINT IF EXISTS levels_language_check;

-- Add a new constraint that allows all supported language values including 'all'
ALTER TABLE public.levels ADD CONSTRAINT levels_language_check 
  CHECK (language IN ('de', 'en', 'es', 'sl', 'all') OR language IS NULL);