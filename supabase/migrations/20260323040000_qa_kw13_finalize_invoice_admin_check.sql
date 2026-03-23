-- KW13 QA Fix: Add admin-only guard to finalize_invoice SECURITY DEFINER function
-- TS-QA-KW13-SEC-001: Any authenticated user could call finalize_invoice via RPC
-- bypassing UI-level admin guard. Added explicit has_role() check.

CREATE OR REPLACE FUNCTION public.finalize_invoice(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year int := date_part('year', now())::int;
  v_next_num int;
  v_invoice_number text;
BEGIN
  -- Admin-only guard (SECURITY DEFINER bypasses RLS, so check explicitly)
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  -- Only assign a number if it doesn't already have one
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

  -- Deduct inventory
  UPDATE inventory i
  SET quantity_on_hand = i.quantity_on_hand - ii.quantity,
      updated_at = now()
  FROM invoice_items ii
  WHERE ii.invoice_id = p_invoice_id
    AND ii.product_id IS NOT NULL
    AND i.product_id = ii.product_id;

  -- Log movements
  INSERT INTO inventory_movements (product_id, quantity_change, movement_type, reason, reference_type, reference_id)
  SELECT ii.product_id, -ii.quantity, 'out', 'Invoice finalized', 'invoice', p_invoice_id::text
  FROM invoice_items ii
  WHERE ii.invoice_id = p_invoice_id AND ii.product_id IS NOT NULL;
END;
$$;
