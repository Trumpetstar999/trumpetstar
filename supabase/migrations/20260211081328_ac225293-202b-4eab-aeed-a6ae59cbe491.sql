
-- Game highscores table
CREATE TABLE public.game_highscores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  level_reached INTEGER NOT NULL DEFAULT 1,
  accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  notes_correct INTEGER NOT NULL DEFAULT 0,
  notes_total INTEGER NOT NULL DEFAULT 0,
  scale_key TEXT NOT NULL DEFAULT 'C',
  scale_type TEXT NOT NULL DEFAULT 'major',
  accidental_mode TEXT NOT NULL DEFAULT 'key_signature',
  range_min TEXT NOT NULL DEFAULT 'C4',
  range_max TEXT NOT NULL DEFAULT 'G5',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_highscores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own highscores"
ON public.game_highscores FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own highscores"
ON public.game_highscores FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own highscores"
ON public.game_highscores FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_game_highscores_user_score ON public.game_highscores (user_id, score DESC);
CREATE INDEX idx_game_highscores_created ON public.game_highscores (created_at DESC);

-- Feature flag for game menu
INSERT INTO public.feature_flags (key, display_name, description, is_enabled, sort_order)
VALUES ('menu_game', 'Game', 'Zeigt den Game-Tab in der Navigation', true, 55);
