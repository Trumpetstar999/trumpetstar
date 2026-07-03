CREATE OR REPLACE FUNCTION public.get_global_top_highscores(p_since timestamptz DEFAULT NULL, p_limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  score int,
  best_streak int,
  level_reached int,
  accuracy numeric,
  scale_key text,
  scale_type text,
  created_at timestamptz,
  display_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gh.id, gh.user_id, gh.score, gh.best_streak, gh.level_reached, gh.accuracy,
         gh.scale_key, gh.scale_type, gh.created_at,
         p.display_name, p.avatar_url
  FROM public.game_highscores gh
  LEFT JOIN public.profiles p ON p.id = gh.user_id
  WHERE (p_since IS NULL OR gh.created_at >= p_since)
  ORDER BY gh.score DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_top_highscores(timestamptz, int) TO authenticated, anon;