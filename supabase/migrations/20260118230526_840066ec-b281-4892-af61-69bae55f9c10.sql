-- Add difficulty column to levels table
ALTER TABLE public.levels 
ADD COLUMN difficulty TEXT DEFAULT 'beginner' 
CHECK (difficulty IN ('beginner', 'easy', 'medium', 'advanced'));