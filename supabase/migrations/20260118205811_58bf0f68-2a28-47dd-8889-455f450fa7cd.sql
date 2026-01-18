-- Create a helper function to check if user can access a recording via chat
CREATE OR REPLACE FUNCTION public.can_view_chat_recording(file_path TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM video_chat_messages vcm
    JOIN video_chat_participants vcp ON vcp.chat_id = vcm.chat_id
    WHERE vcm.video_storage_path = file_path
      AND vcp.user_id = auth.uid()
  )
$$;

-- Add policy to allow chat participants to view shared videos
CREATE POLICY "Chat participants can view shared videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recordings' 
  AND public.can_view_chat_recording(name)
);