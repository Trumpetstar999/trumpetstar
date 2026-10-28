CREATE OR REPLACE FUNCTION public.get_pdf_book_catalog()
RETURNS TABLE(id uuid, title text, title_en text, title_es text, description text, description_en text, description_es text, page_count integer, plan_required text, level_id uuid, sort_index integer, language text, cover_image_url text, order_link text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id, d.title, d.title_en, d.title_es, d.description, d.description_en, d.description_es,
         d.page_count, d.plan_required::text, d.level_id, d.sort_index, d.language, d.cover_image_url, d.order_link
  FROM public.pdf_documents d WHERE d.is_active = true ORDER BY d.sort_index
$$;
REVOKE ALL ON FUNCTION public.get_pdf_book_catalog() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pdf_book_catalog() TO authenticated;