-- Make the recordings bucket private
UPDATE storage.buckets SET public = false WHERE id = 'recordings';

-- Drop the public viewing policy
DROP POLICY IF EXISTS "Public can view recordings" ON storage.objects;