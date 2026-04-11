
-- Welcome videos table
CREATE TABLE public.welcome_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  title_es TEXT,
  vimeo_video_id TEXT NOT NULL,
  vimeo_player_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.welcome_videos ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active welcome videos
CREATE POLICY "Authenticated users can view welcome videos"
ON public.welcome_videos FOR SELECT TO authenticated
USING (true);

-- Admins can manage welcome videos
CREATE POLICY "Admins can insert welcome videos"
ON public.welcome_videos FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update welcome videos"
ON public.welcome_videos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete welcome videos"
ON public.welcome_videos FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User progress tracking for welcome videos
CREATE TABLE public.welcome_video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  welcome_video_id UUID NOT NULL REFERENCES public.welcome_videos(id) ON DELETE CASCADE,
  watched BOOLEAN DEFAULT false,
  watched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, welcome_video_id)
);

ALTER TABLE public.welcome_video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own welcome progress"
ON public.welcome_video_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own welcome progress"
ON public.welcome_video_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own welcome progress"
ON public.welcome_video_progress FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at on welcome_videos
CREATE TRIGGER update_welcome_videos_updated_at
BEFORE UPDATE ON public.welcome_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
