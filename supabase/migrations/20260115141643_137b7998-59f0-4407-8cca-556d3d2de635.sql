-- Drop and recreate the view with security_invoker
DROP VIEW IF EXISTS public.admin_dashboard_stats;

CREATE VIEW public.admin_dashboard_stats
WITH (security_invoker = on) AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(DISTINCT user_id) FROM public.activity_logs WHERE created_at > NOW() - INTERVAL '24 hours') as active_today,
  (SELECT COUNT(DISTINCT user_id) FROM public.activity_logs WHERE created_at > NOW() - INTERVAL '7 days') as active_this_week,
  (SELECT COUNT(*) FROM public.video_completions) as total_stars;