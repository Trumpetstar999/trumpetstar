-- Add admin policy for videos table management
CREATE POLICY "Admins can manage videos" 
ON public.videos 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));