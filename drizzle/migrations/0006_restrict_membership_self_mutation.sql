DROP POLICY IF EXISTS "Users can insert own membership" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can update own membership" ON public.user_memberships;
REVOKE ALL ON public.user_memberships, public.user_membership_cache, public.digistore24_entitlements FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_memberships, public.user_membership_cache, public.digistore24_entitlements TO authenticated;
GRANT ALL ON public.user_memberships, public.user_membership_cache, public.digistore24_entitlements TO service_role;