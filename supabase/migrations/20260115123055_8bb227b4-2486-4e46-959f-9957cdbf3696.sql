-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create new policy that allows users to always see their own roles
CREATE POLICY "Users can view own roles or admins can view all"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));