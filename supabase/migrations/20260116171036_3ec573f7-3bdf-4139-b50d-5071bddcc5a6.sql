-- Drop and recreate admin policy with proper configuration
DROP POLICY IF EXISTS "Admins can manage PDF documents" ON public.pdf_documents;

CREATE POLICY "Admins can manage PDF documents"
ON public.pdf_documents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);