-- Remove the check constraint on difficulty column to allow flexible values
ALTER TABLE public.levels DROP CONSTRAINT IF EXISTS levels_difficulty_check;