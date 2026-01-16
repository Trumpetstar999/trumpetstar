-- Make pdf-documents bucket private (not publicly accessible)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'pdf-documents';

-- Drop the public SELECT policy
DROP POLICY IF EXISTS "Public can view PDF documents" ON storage.objects;

-- Create new policy: Only authenticated users can view PDF documents
CREATE POLICY "Authenticated users can view PDF documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'pdf-documents');

-- Also make pdf-audio bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'pdf-audio';

-- Drop the public SELECT policy for audio
DROP POLICY IF EXISTS "Public can view PDF audio" ON storage.objects;

-- Create new policy: Only authenticated users can view PDF audio
CREATE POLICY "Authenticated users can view PDF audio"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'pdf-audio');