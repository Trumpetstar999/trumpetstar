CREATE TABLE public.landing_page_view_counts (visited_at timestamptz PRIMARY KEY, views bigint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.landing_page_view_counts TO service_role;
GRANT SELECT ON public.landing_page_view_counts TO authenticated;
ALTER TABLE public.landing_page_view_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read landing counters" ON public.landing_page_view_counts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.capture_landing_view() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $fn$
 INSERT INTO public.landing_page_view_counts(visited_at,views) VALUES (date_trunc('day',now() AT TIME ZONE 'Europe/Vienna') AT TIME ZONE 'Europe/Vienna',1) ON CONFLICT(visited_at) DO UPDATE SET views=landing_page_view_counts.views+1;
$fn$;
REVOKE ALL ON FUNCTION public.capture_landing_view() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.capture_landing_view() TO service_role;
DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.admin_dashboard_snapshot(integer)'::regprocedure) INTO definition;
 definition := replace(definition, 'count(*) AS views FROM public.landing_page_views', 'sum(views) AS views FROM public.landing_page_view_counts');
 definition := replace(definition, '(SELECT count(*) FROM public.landing_page_views', '(SELECT coalesce(sum(views),0) FROM public.landing_page_view_counts');
 IF position('public.landing_page_views' in definition)>0 OR position('public.landing_page_view_counts' in definition)=0 THEN RAISE EXCEPTION 'Dashboard definition did not match'; END IF;
 EXECUTE definition;
END $migration$;
COMMENT ON TABLE public.landing_page_view_counts IS 'Anonymous landingpage views since activation; no cookies, identifiers, referrers or device data. Vienna daily aggregates. Not unique people. Legacy rows remain separate.';