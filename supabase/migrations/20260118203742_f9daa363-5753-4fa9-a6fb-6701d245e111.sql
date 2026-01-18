-- Drop the old check constraint
ALTER TABLE public.video_chats DROP CONSTRAINT video_chats_context_type_check;

-- Add the new check constraint with 'teacher_chat' included
ALTER TABLE public.video_chats ADD CONSTRAINT video_chats_context_type_check 
CHECK (context_type = ANY (ARRAY['user_video'::text, 'teacher_discussion'::text, 'admin_feedback'::text, 'teacher_chat'::text]));