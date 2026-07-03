
ALTER TABLE public.game_highscores ADD COLUMN IF NOT EXISTS player_name text;

DROP FUNCTION IF EXISTS public.get_global_top_highscores(timestamp with time zone, integer);

CREATE OR REPLACE FUNCTION public.get_global_top_highscores(p_since timestamp with time zone DEFAULT NULL::timestamp with time zone, p_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, user_id uuid, score integer, best_streak integer, level_reached integer, accuracy numeric, scale_key text, scale_type text, created_at timestamp with time zone, display_name text, avatar_url text, player_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT gh.id, gh.user_id, gh.score, gh.best_streak, gh.level_reached, gh.accuracy,
         gh.scale_key, gh.scale_type, gh.created_at,
         p.display_name, p.avatar_url, gh.player_name
  FROM public.game_highscores gh
  LEFT JOIN public.profiles p ON p.id = gh.user_id
  WHERE (p_since IS NULL OR gh.created_at >= p_since)
  ORDER BY gh.score DESC
  LIMIT p_limit;
$function$;

GRANT EXECUTE ON FUNCTION public.get_global_top_highscores(timestamp with time zone, integer) TO authenticated, anon;
