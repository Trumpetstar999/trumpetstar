-- Add column to track if user has seen the welcome slideshow
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS has_seen_welcome boolean DEFAULT false;