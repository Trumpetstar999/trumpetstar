
-- Review settings (admin-configurable)
CREATE TABLE public.review_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  google_review_url TEXT NOT NULL DEFAULT '',
  google_review_qr_image TEXT,
  enable_review_prompt BOOLEAN NOT NULL DEFAULT true,
  min_days_since_signup INTEGER NOT NULL DEFAULT 7,
  min_videos_completed INTEGER NOT NULL DEFAULT 10,
  cooldown_days INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.review_settings (id) VALUES ('default');

-- Enable RLS
ALTER TABLE public.review_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read review settings"
  ON public.review_settings FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update review settings"
  ON public.review_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_teacher = true)
  );

-- User review tracking
CREATE TABLE public.user_review_tracking (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_review_prompt_at TIMESTAMPTZ,
  review_prompt_optout BOOLEAN NOT NULL DEFAULT false,
  review_cta_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

ALTER TABLE public.user_review_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own review tracking"
  ON public.user_review_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own review tracking"
  ON public.user_review_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review tracking"
  ON public.user_review_tracking FOR UPDATE
  USING (auth.uid() = user_id);
