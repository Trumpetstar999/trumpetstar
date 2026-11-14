DROP POLICY IF EXISTS "Users can insert own daily usage" ON public.daily_usage;
DROP POLICY IF EXISTS "Users can update own daily usage" ON public.daily_usage;
DROP POLICY IF EXISTS "Everyone can view active videos" ON public.videos;
CREATE POLICY "Signed-in users can view active videos" ON public.videos FOR SELECT TO authenticated USING (is_active = true);
REVOKE SELECT ON public.videos FROM anon;