-- Fix infinite recursion in video_chat_participants RLS policy
-- Drop the problematic policies
DROP POLICY IF EXISTS "Participants can view chat participants" ON public.video_chat_participants;
DROP POLICY IF EXISTS "Chat creators can add participants" ON public.video_chat_participants;

-- Create fixed policies without recursion
-- For SELECT: Allow users to see participants of chats they created or are part of
CREATE POLICY "Users can view chat participants"
ON public.video_chat_participants
FOR SELECT
USING (
  -- User can see participants if they are the chat creator
  EXISTS (
    SELECT 1 FROM public.video_chats vc
    WHERE vc.id = video_chat_participants.chat_id
    AND vc.created_by = auth.uid()
  )
  -- Or if the user is a participant themselves (check directly on user_id)
  OR user_id = auth.uid()
  -- Or if admin
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- For INSERT: Chat creators can add participants
CREATE POLICY "Chat creators can add participants"
ON public.video_chat_participants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.video_chats vc
    WHERE vc.id = video_chat_participants.chat_id
    AND vc.created_by = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add DELETE policy for cleanup
CREATE POLICY "Chat creators can remove participants"
ON public.video_chat_participants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.video_chats vc
    WHERE vc.id = video_chat_participants.chat_id
    AND vc.created_by = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);