-- Allow video_id to be NULL for login stars (daily login bonus)
ALTER TABLE public.video_completions ALTER COLUMN video_id DROP NOT NULL;