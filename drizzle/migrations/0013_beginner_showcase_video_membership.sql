CREATE TABLE public.beginner_showcase_videos (
 showcase_id text NOT NULL,
 video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
 sort_order integer NOT NULL DEFAULT 0,
 PRIMARY KEY (showcase_id, video_id)
);
GRANT SELECT ON public.beginner_showcase_videos TO authenticated;
GRANT ALL ON public.beginner_showcase_videos TO service_role;
ALTER TABLE public.beginner_showcase_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read beginner showcase videos" ON public.beginner_showcase_videos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);