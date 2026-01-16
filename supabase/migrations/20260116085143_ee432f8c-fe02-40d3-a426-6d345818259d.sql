-- Fix security definer view by adding proper security invoker
DROP VIEW IF EXISTS public.admin_plan_stats;

-- Recreate view with SECURITY INVOKER (default, safer)
CREATE VIEW public.admin_plan_stats 
WITH (security_invoker = true)
AS
SELECT 
  p.key as plan_key,
  p.display_name,
  p.rank,
  COALESCE(COUNT(umc.id), 0)::integer as user_count
FROM public.plans p
LEFT JOIN public.user_membership_cache umc ON umc.plan_key = p.key
GROUP BY p.key, p.display_name, p.rank
ORDER BY p.rank;