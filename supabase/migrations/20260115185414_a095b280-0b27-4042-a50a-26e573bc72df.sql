-- Create storage bucket for recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for users to upload their own recordings
CREATE POLICY "Users can upload their own recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to view their own recordings
CREATE POLICY "Users can view their own recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to delete their own recordings
CREATE POLICY "Users can delete their own recordings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for public read access to recordings (since bucket is public)
CREATE POLICY "Public can view recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'recordings');