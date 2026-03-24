
-- Create audio-files storage bucket (public, for admin-uploaded tracks)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Audio files are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-files');

-- Allow admin upload
CREATE POLICY "Admins can upload audio files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-files'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Allow admin delete
CREATE POLICY "Admins can delete audio files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio-files'
    AND public.has_role(auth.uid(), 'admin')
  );
