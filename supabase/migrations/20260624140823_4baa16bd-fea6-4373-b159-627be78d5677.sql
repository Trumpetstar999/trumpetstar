
-- Fix audio_levels/files/items: add explicit WITH CHECK on policies and ensure grants
GRANT SELECT ON public.audio_levels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audio_levels TO authenticated;
GRANT ALL ON public.audio_levels TO service_role;

GRANT SELECT ON public.audio_files TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audio_files TO authenticated;
GRANT ALL ON public.audio_files TO service_role;

GRANT SELECT ON public.audio_level_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audio_level_items TO authenticated;
GRANT ALL ON public.audio_level_items TO service_role;

-- Drop old combined ALL policies and replace with explicit ones that include WITH CHECK
DROP POLICY IF EXISTS "Admins can manage audio levels" ON public.audio_levels;
DROP POLICY IF EXISTS "Admins can manage audio files" ON public.audio_files;
DROP POLICY IF EXISTS "Admins can manage audio level items" ON public.audio_level_items;

CREATE POLICY "Admins insert audio_levels" ON public.audio_levels
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update audio_levels" ON public.audio_levels
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete audio_levels" ON public.audio_levels
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert audio_files" ON public.audio_files
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update audio_files" ON public.audio_files
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete audio_files" ON public.audio_files
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert audio_level_items" ON public.audio_level_items
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update audio_level_items" ON public.audio_level_items
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete audio_level_items" ON public.audio_level_items
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
