-- Migration: email_log RLS Fix
-- Datum: 2026-03-23
-- Problem: SELECT policy war TO public → jeder (auch anon) konnte alle E-Mail-Logs lesen
-- Fix: SELECT nur für authenticated Users mit admin-Rolle

-- Alte zu-permissive Select-Policy entfernen
DROP POLICY IF EXISTS "Allow select email_log" ON public.email_log;

-- Neue restriktive Select-Policy: nur Admins
CREATE POLICY "email_log_admin_select"
  ON public.email_log
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    )
  );

-- INSERT bleibt für anon/service (Tracking-Pixel, Edge Functions)
-- UPDATE bleibt für anon/service (opened_at, clicked_at via Tracking-Pixel)
-- Kein Handlungsbedarf dort.
