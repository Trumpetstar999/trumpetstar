DROP POLICY IF EXISTS "Audio files are readable by everyone" ON public.audio_files;
CREATE POLICY "Signed-in users can read audio metadata" ON public.audio_files FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Audio levels are readable by everyone" ON public.audio_levels;
CREATE POLICY "Signed-in users can read audio levels" ON public.audio_levels FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Audio level items are readable by everyone" ON public.audio_level_items;
CREATE POLICY "Signed-in users can read audio level items" ON public.audio_level_items FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.audio_files, public.audio_levels, public.audio_level_items FROM anon;
GRANT SELECT ON public.audio_files, public.audio_levels, public.audio_level_items TO authenticated;
GRANT ALL ON public.audio_files, public.audio_levels, public.audio_level_items TO service_role;
DROP POLICY IF EXISTS "Anyone can read email templates" ON public.email_templates;
CREATE POLICY "Admins can read email templates" ON public.email_templates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
REVOKE SELECT ON public.email_templates FROM anon;
GRANT SELECT ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
DROP POLICY IF EXISTS "Anyone can read review settings" ON public.review_settings;
CREATE POLICY "Signed-in users can read review settings" ON public.review_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.review_settings FROM anon;
GRANT SELECT ON public.review_settings TO authenticated;
GRANT ALL ON public.review_settings TO service_role;
DROP POLICY IF EXISTS "Everyone can view sync logs" ON public.vimeo_sync_log;
CREATE POLICY "Admins can view Vimeo sync logs" ON public.vimeo_sync_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
REVOKE SELECT ON public.vimeo_sync_log FROM anon;
GRANT SELECT ON public.vimeo_sync_log TO authenticated;
GRANT ALL ON public.vimeo_sync_log TO service_role;
DROP POLICY IF EXISTS "Authenticated users can view PDF documents" ON storage.objects;
DROP POLICY IF EXISTS "Plan-entitled users can view PDF documents" ON storage.objects;
CREATE POLICY "Plan-entitled users can view PDF documents" ON storage.objects FOR SELECT TO authenticated USING (
 bucket_id = 'pdf-documents' AND (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
   SELECT 1 FROM public.pdf_documents d
   WHERE d.is_active = true AND public.can_access_plan(d.plan_required)
   AND split_part(d.pdf_file_url, '?', 1) IN (
    'https://osgrjouxwpnokfvzztji.supabase.co/storage/v1/object/public/pdf-documents/' || storage.objects.name,
    'https://osgrjouxwpnokfvzztji.supabase.co/storage/v1/object/sign/pdf-documents/' || storage.objects.name,
    'https://osgrjouxwpnokfvzztji.supabase.co/storage/v1/object/authenticated/pdf-documents/' || storage.objects.name
   )
  )
 )
);