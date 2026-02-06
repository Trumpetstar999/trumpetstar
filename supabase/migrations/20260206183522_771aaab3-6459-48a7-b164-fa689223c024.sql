-- Add skill_level column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS skill_level text DEFAULT 'beginner';

-- Add comment for documentation
COMMENT ON COLUMN public.user_preferences.skill_level IS 'User skill level: beginner or intermediate';