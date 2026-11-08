CREATE OR REPLACE FUNCTION public.admin_dashboard_snapshot(p_days integer DEFAULT 14)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb; today date := (now() AT TIME ZONE 'Europe/Vienna')::date; week_day date := date_trunc('week',now() AT TIME ZONE 'Europe/Vienna')::date; month_day date := date_trunc('month',now() AT TIME ZONE 'Europe/Vienna')::date;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin'::public.app_role) THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501'; END IF;
 IF p_days NOT IN (7,14,30,90) THEN RAISE EXCEPTION 'Invalid period' USING ERRCODE='22023'; END IF;
 WITH plan_users AS (
 SELECT p.id, CASE upper(coalesce(m.plan_key,m.current_plan,c.plan_key,'FREE')) WHEN 'PREMIUM' THEN 'PRO' WHEN 'PRO' THEN 'PRO' WHEN 'BASIC' THEN 'BASIC' ELSE 'FREE' END AS plan
 FROM public.profiles p LEFT JOIN LATERAL (SELECT plan_key,current_plan FROM public.user_memberships WHERE user_id=p.id ORDER BY updated_at DESC,id LIMIT 1) m ON true LEFT JOIN public.user_membership_cache c ON c.user_id=p.id
 ), days AS (SELECT generate_series(today-p_days+1,today,interval '1 day')::date AS day),
 log_days AS (SELECT (created_at AT TIME ZONE 'Europe/Vienna')::date AS day,count(*) AS logins,count(distinct user_id) AS active FROM public.activity_logs WHERE action='login' AND created_at >= ((today-p_days+1)::timestamp AT TIME ZONE 'Europe/Vienna') GROUP BY 1),
 star_days AS (SELECT (completed_at AT TIME ZONE 'Europe/Vienna')::date AS day,count(*) AS stars FROM public.video_completions WHERE completed_at >= ((today-p_days+1)::timestamp AT TIME ZONE 'Europe/Vienna') GROUP BY 1),
 new_days AS (SELECT (created_at AT TIME ZONE 'Europe/Vienna')::date AS day,count(*) AS registrations FROM public.profiles WHERE created_at >= ((today-p_days+1)::timestamp AT TIME ZONE 'Europe/Vienna') GROUP BY 1),
 view_days AS (SELECT (visited_at AT TIME ZONE 'Europe/Vienna')::date AS day,count(*) AS views FROM public.landing_page_views WHERE visited_at >= ((today-p_days+1)::timestamp AT TIME ZONE 'Europe/Vienna') GROUP BY 1)
 SELECT jsonb_build_object('generated_at',now(),'timezone','Europe/Vienna','stats',jsonb_build_object(
 'total_users',(SELECT count(*) FROM public.profiles),'total_stars',(SELECT count(*) FROM public.video_completions),
 'active_today',(SELECT count(distinct user_id) FROM public.activity_logs WHERE created_at >= (today::timestamp AT TIME ZONE 'Europe/Vienna')),
 'active_this_week',(SELECT count(distinct user_id) FROM public.activity_logs WHERE created_at >= (week_day::timestamp AT TIME ZONE 'Europe/Vienna')),
 'new_today',(SELECT count(*) FROM public.profiles WHERE created_at >= (today::timestamp AT TIME ZONE 'Europe/Vienna')),
 'new_this_week',(SELECT count(*) FROM public.profiles WHERE created_at >= (week_day::timestamp AT TIME ZONE 'Europe/Vienna')),
 'new_this_month',(SELECT count(*) FROM public.profiles WHERE created_at >= (month_day::timestamp AT TIME ZONE 'Europe/Vienna')),
 'views_today',(SELECT count(*) FROM public.landing_page_views WHERE visited_at >= (today::timestamp AT TIME ZONE 'Europe/Vienna')),
 'views_this_week',(SELECT count(*) FROM public.landing_page_views WHERE visited_at >= (week_day::timestamp AT TIME ZONE 'Europe/Vienna')),
 'views_this_month',(SELECT count(*) FROM public.landing_page_views WHERE visited_at >= (month_day::timestamp AT TIME ZONE 'Europe/Vienna'))),
 'plans',(SELECT jsonb_agg(jsonb_build_object('plan',k.plan,'count',(SELECT count(*) FROM plan_users u WHERE u.plan=k.plan))) FROM (VALUES ('FREE'),('BASIC'),('PRO')) k(plan)),
 'days',(SELECT jsonb_agg(jsonb_build_object('date',d.day,'logins',coalesce(l.logins,0),'active',coalesce(l.active,0),'stars',coalesce(s.stars,0),'registrations',coalesce(n.registrations,0),'views',coalesce(v.views,0)) ORDER BY d.day) FROM days d LEFT JOIN log_days l USING(day) LEFT JOIN star_days s USING(day) LEFT JOIN new_days n USING(day) LEFT JOIN view_days v USING(day)),
 'top_logins',(SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM (SELECT p.id,p.display_name,count(*) AS count,max(a.created_at) AS last_activity FROM public.activity_logs a JOIN public.profiles p ON p.id=a.user_id WHERE a.action='login' AND a.created_at >= ((today-p_days+1)::timestamp AT TIME ZONE 'Europe/Vienna') GROUP BY p.id,p.display_name ORDER BY count(*) DESC,p.id LIMIT 10) x),
 'top_stars',(SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM (SELECT p.id,p.display_name,count(*) AS count,max(s.completed_at) AS last_activity FROM public.video_completions s JOIN public.profiles p ON p.id=s.user_id GROUP BY p.id,p.display_name ORDER BY count(*) DESC,p.id LIMIT 10) x),
 'recent',(SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM (SELECT a.id,p.display_name,a.action,a.created_at FROM public.activity_logs a LEFT JOIN public.profiles p ON p.id=a.user_id ORDER BY a.created_at DESC,a.id LIMIT 20) x)
 ) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.admin_dashboard_snapshot(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_snapshot(integer) TO authenticated;
COMMENT ON FUNCTION public.admin_dashboard_snapshot(integer) IS 'Admin-only complete dashboard snapshot, calendar boundaries in Europe/Vienna; membership rows take precedence over cache.';