
CREATE OR REPLACE VIEW public.admin_plan_stats AS
SELECT
  p.key AS plan_key,
  p.display_name,
  p.rank,
  COALESCE(COUNT(um.user_id), 0)::integer AS user_count
FROM plans p
LEFT JOIN user_memberships um ON um.plan_key = p.key
GROUP BY p.key, p.display_name, p.rank
ORDER BY p.rank;
