CREATE TABLE public.toneforce_highscores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  player_name text,
  score integer NOT NULL DEFAULT 0,
  level_reached integer NOT NULL DEFAULT 1,
  difficulty text,
  instrument text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.toneforce_highscores TO authenticated;
GRANT ALL ON public.toneforce_highscores TO service_role;

ALTER TABLE public.toneforce_highscores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own toneforce scores"
ON public.toneforce_highscores FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own toneforce scores"
ON public.toneforce_highscores FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all toneforce scores"
ON public.toneforce_highscores FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own toneforce scores"
ON public.toneforce_highscores FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_toneforce_highscores_score ON public.toneforce_highscores (score DESC, created_at ASC);

CREATE OR REPLACE FUNCTION public.get_toneforce_top_highscores(p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, user_id uuid, player_name text, score integer, level_reached integer, difficulty text, instrument text, created_at timestamptz, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT th.id, th.user_id, th.player_name, th.score, th.level_reached, th.difficulty, th.instrument, th.created_at,
         p.display_name, p.avatar_url
  FROM public.toneforce_highscores th
  LEFT JOIN public.profiles p ON p.id = th.user_id
  ORDER BY th.score DESC, th.created_at ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
$$;