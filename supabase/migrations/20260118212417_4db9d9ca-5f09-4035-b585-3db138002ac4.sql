-- Add policy to allow viewing profiles of users you share a chat with
CREATE POLICY "Users can view profiles of chat participants"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM video_chat_participants vcp1
    JOIN video_chat_participants vcp2 ON vcp1.chat_id = vcp2.chat_id
    WHERE vcp1.user_id = auth.uid()
      AND vcp2.user_id = profiles.id
  )
);

-- Also allow viewing teacher profiles if assigned to them
CREATE POLICY "Students can view their teacher profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM teacher_assignments ta
    WHERE ta.user_id = auth.uid()
      AND ta.teacher_id = profiles.id
      AND ta.is_active = true
  )
);

-- Also allow teachers to view their student profiles
CREATE POLICY "Teachers can view their student profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM teacher_assignments ta
    WHERE ta.teacher_id = auth.uid()
      AND ta.user_id = profiles.id
      AND ta.is_active = true
  )
);