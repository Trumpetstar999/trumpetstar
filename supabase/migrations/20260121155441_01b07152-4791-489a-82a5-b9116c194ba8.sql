-- Add admin policies for levels table management
CREATE POLICY "Admins can manage levels" 
ON public.levels 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Also add admin policies for sections table
CREATE POLICY "Admins can manage sections" 
ON public.sections 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));