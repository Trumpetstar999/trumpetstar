-- Allow reading public profiles
CREATE POLICY "Authenticated can read public profiles"
ON public.profiles FOR SELECT TO authenticated
USING (privacy_setting = 'public');

-- Function: public star ranking
CREATE OR REPLACE FUNCTION public.get_public_star_ranking()
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, star_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url, COUNT(vc.id) as star_count
  FROM profiles p
  LEFT JOIN video_completions vc ON vc.user_id = p.id
  WHERE p.privacy_setting = 'public'
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY star_count DESC
  LIMIT 20;
$$;

-- Function: friends star ranking
CREATE OR REPLACE FUNCTION public.get_friends_star_ranking(_user_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, star_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url, COUNT(vc.id) as star_count
  FROM profiles p
  LEFT JOIN video_completions vc ON vc.user_id = p.id
  WHERE p.id = _user_id
     OR p.id IN (
       SELECT CASE WHEN requester_id = _user_id THEN addressee_id ELSE requester_id END
       FROM friendships
       WHERE (requester_id = _user_id OR addressee_id = _user_id) AND status = 'accepted'
     )
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY star_count DESC
  LIMIT 50;
$$;