-- Add cover_image_url column to pdf_documents table
ALTER TABLE public.pdf_documents 
ADD COLUMN cover_image_url text;

-- Add comment for clarity
COMMENT ON COLUMN public.pdf_documents.cover_image_url IS 'URL to cover image for the PDF document';

-- Create storage bucket for PDF cover images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-covers', 'pdf-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view cover images (public bucket)
CREATE POLICY "Anyone can view pdf covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdf-covers');

-- Only admins can upload/modify cover images
CREATE POLICY "Admins can upload pdf covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pdf-covers' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update pdf covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pdf-covers' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete pdf covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pdf-covers' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);