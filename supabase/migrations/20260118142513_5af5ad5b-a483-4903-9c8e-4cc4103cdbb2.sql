-- Allow users to create their own teacher assignment (auto-assign)
CREATE POLICY "Users can create their own teacher assignment"
ON public.teacher_assignments
FOR INSERT
WITH CHECK (auth.uid() = user_id);