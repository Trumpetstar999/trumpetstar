-- 1. Plan helper functions (SECURITY INVOKER, relies on own-membership RLS)
CREATE OR REPLACE FUNCTION public.plan_rank_of(_plan text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE upper(coalesce(_plan, 'FREE'))
    WHEN 'FREE' THEN 0
    WHEN 'BASIC' THEN 10
    WHEN 'PRO' THEN 20
    WHEN 'PREMIUM' THEN 20
    ELSE 0
  END
$$;

CREATE OR REPLACE FUNCTION public.can_access_plan(_plan text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN public.plan_rank_of(_plan) = 0 THEN true
    WHEN auth.uid() IS NULL THEN false
    WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN true
    ELSE coalesce((
      SELECT max(coalesce(um.plan_rank, public.plan_rank_of(coalesce(um.plan_key, um.current_plan))))
      FROM public.user_memberships um
      WHERE um.user_id = auth.uid()
    ), 0) >= public.plan_rank_of(_plan)
  END
$$;

GRANT EXECUTE ON FUNCTION public.plan_rank_of(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_plan(text) TO anon, authenticated, service_role;

-- 2. classrooms: fix broken self-join in participant visibility policy
DROP POLICY IF EXISTS "Participants can view classrooms" ON public.classrooms;
CREATE POLICY "Participants can view classrooms"
ON public.classrooms
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.classroom_participants cp
  WHERE cp.classroom_id = classrooms.id
    AND cp.user_id = auth.uid()
));

-- 3. knowledge base: gate by plan
DROP POLICY IF EXISTS "Anyone can read knowledge sources" ON public.knowledge_sources;
CREATE POLICY "Plan-entitled users can read knowledge sources"
ON public.knowledge_sources
FOR SELECT
USING (public.can_access_plan(visibility));

DROP POLICY IF EXISTS "Anyone can read knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Plan-entitled users can read knowledge chunks"
ON public.knowledge_chunks
FOR SELECT
USING (public.can_access_plan(plan_required));

-- 4. repertoire items: gate by plan
DROP POLICY IF EXISTS "Anyone can read repertoire items" ON public.repertoire_items;
CREATE POLICY "Plan-entitled users can read repertoire items"
ON public.repertoire_items
FOR SELECT
USING (public.can_access_plan(plan_required));

-- 5. paid documents: gate by plan
DROP POLICY IF EXISTS "Anyone can view active PDF documents" ON public.pdf_documents;
CREATE POLICY "Plan-entitled users can view active PDF documents"
ON public.pdf_documents
FOR SELECT
USING (is_active = true AND public.can_access_plan(plan_required));

DROP POLICY IF EXISTS "Anyone can view active musicxml documents" ON public.musicxml_documents;
CREATE POLICY "Plan-entitled users can view active musicxml documents"
ON public.musicxml_documents
FOR SELECT
USING (is_active = true AND public.can_access_plan(plan_required));

-- 6. storage: gate paid PDF objects by plan
DROP POLICY IF EXISTS "Authenticated users can view PDF documents" ON storage.objects;
CREATE POLICY "Plan-entitled users can view PDF documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdf-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.pdf_documents d
      WHERE d.pdf_file_url LIKE '%' || storage.objects.name
        AND d.is_active = true
        AND public.can_access_plan(d.plan_required)
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.pdf_documents d2
      WHERE d2.pdf_file_url LIKE '%' || storage.objects.name
    )
  )
);

-- 7. review_settings: only admins may update
DROP POLICY IF EXISTS "Admins can update review settings" ON public.review_settings;
CREATE POLICY "Admins can update review settings"
ON public.review_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. admin_plan_stats view must respect the querying user's permissions
ALTER VIEW public.admin_plan_stats SET (security_invoker = on);

-- 9. SECURITY DEFINER functions: restrict who can execute them
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_assign_teacher_on_pro() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.next_invoice_number(integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.add_stock(uuid, integer, text) FROM anon;
REVOKE ALL ON FUNCTION public.finalize_invoice(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.increment_daily_usage(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.get_friends_star_ranking(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_star_ranking() FROM anon;

-- Admin-only guards inside privileged invoice/inventory functions
CREATE OR REPLACE FUNCTION public.add_stock(p_product_id uuid, p_quantity integer, p_reason text DEFAULT 'Wareneingang'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.inventory (product_id, quantity_on_hand)
  VALUES (p_product_id, p_quantity)
  ON CONFLICT (product_id) DO UPDATE SET quantity_on_hand = inventory.quantity_on_hand + p_quantity, updated_at = now();
  INSERT INTO public.inventory_movements (product_id, quantity_change, movement_type, reason) VALUES (p_product_id, p_quantity, 'in', p_reason);
END;
$function$;

CREATE OR REPLACE FUNCTION public.finalize_invoice(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_year int := date_part('year', now())::int;
  v_next_num int;
  v_invoice_number text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM invoices WHERE id = p_invoice_id AND invoice_number IS NOT NULL
  ) THEN
    INSERT INTO invoice_sequences (year, last_number)
    VALUES (v_year, 1)
    ON CONFLICT (year) DO UPDATE
      SET last_number = invoice_sequences.last_number + 1
    RETURNING last_number INTO v_next_num;

    v_invoice_number := v_year || '-' || lpad(v_next_num::text, 3, '0');

    UPDATE invoices
    SET invoice_number = v_invoice_number,
        status = 'sent',
        updated_at = now()
    WHERE id = p_invoice_id;
  ELSE
    UPDATE invoices
    SET status = 'sent',
        updated_at = now()
    WHERE id = p_invoice_id;
  END IF;

  UPDATE inventory i
  SET quantity_on_hand = i.quantity_on_hand - ii.quantity,
      updated_at = now()
  FROM invoice_items ii
  WHERE ii.invoice_id = p_invoice_id
    AND ii.product_id IS NOT NULL
    AND i.product_id = ii.product_id;

  INSERT INTO inventory_movements (product_id, quantity_change, movement_type, reason, reference_type, reference_id)
  SELECT ii.product_id, -ii.quantity, 'out', 'Invoice finalized', 'invoice', p_invoice_id::text
  FROM invoice_items ii
  WHERE ii.invoice_id = p_invoice_id AND ii.product_id IS NOT NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_daily_usage(p_user_id uuid, p_date_key text, p_type text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.daily_usage (user_id, date_key, video_starts, game_starts)
  VALUES (
    p_user_id,
    p_date_key,
    CASE WHEN p_type = 'video' THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'game' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, date_key) DO UPDATE
    SET video_starts = public.daily_usage.video_starts + CASE WHEN p_type = 'video' THEN 1 ELSE 0 END,
        game_starts  = public.daily_usage.game_starts  + CASE WHEN p_type = 'game'  THEN 1 ELSE 0 END,
        updated_at = now()
  RETURNING CASE WHEN p_type = 'video' THEN video_starts ELSE game_starts END INTO v_count;

  RETURN v_count;
END;
$function$;