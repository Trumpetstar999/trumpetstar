
-- Create daily_usage table
CREATE TABLE public.daily_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date_key TEXT NOT NULL,
  videos_started INTEGER NOT NULL DEFAULT 0,
  games_started INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_usage_user_date_unique UNIQUE (user_id, date_key)
);

-- Index for fast lookups
CREATE INDEX idx_daily_usage_user_date ON public.daily_usage (user_id, date_key);

-- Enable RLS
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own daily usage"
  ON public.daily_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily usage"
  ON public.daily_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily usage"
  ON public.daily_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin full access
CREATE POLICY "Admins have full access to daily usage"
  ON public.daily_usage FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Atomic increment function
CREATE OR REPLACE FUNCTION public.increment_daily_usage(
  p_user_id UUID,
  p_date_key TEXT,
  p_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_value INTEGER;
BEGIN
  IF p_type = 'video' THEN
    INSERT INTO public.daily_usage (user_id, date_key, videos_started, updated_at)
    VALUES (p_user_id, p_date_key, 1, now())
    ON CONFLICT (user_id, date_key)
    DO UPDATE SET videos_started = daily_usage.videos_started + 1, updated_at = now()
    RETURNING videos_started INTO v_new_value;
  ELSIF p_type = 'game' THEN
    INSERT INTO public.daily_usage (user_id, date_key, games_started, updated_at)
    VALUES (p_user_id, p_date_key, 1, now())
    ON CONFLICT (user_id, date_key)
    DO UPDATE SET games_started = daily_usage.games_started + 1, updated_at = now()
    RETURNING games_started INTO v_new_value;
  ELSE
    RAISE EXCEPTION 'Invalid type: %. Must be "video" or "game".', p_type;
  END IF;

  RETURN v_new_value;
END;
$$;
