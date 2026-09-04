CREATE OR REPLACE FUNCTION public.increment_daily_usage(p_user_id uuid, p_date_key text, p_type text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.daily_usage (user_id, date_key, videos_started, games_started)
  VALUES (
    p_user_id,
    p_date_key,
    CASE WHEN p_type = 'video' THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'game' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, date_key) DO UPDATE
    SET videos_started = public.daily_usage.videos_started + CASE WHEN p_type = 'video' THEN 1 ELSE 0 END,
        games_started  = public.daily_usage.games_started  + CASE WHEN p_type = 'game'  THEN 1 ELSE 0 END,
        updated_at = now()
  RETURNING CASE WHEN p_type = 'video' THEN daily_usage.videos_started ELSE daily_usage.games_started END
  INTO v_count;

  RETURN v_count;
END;
$function$;