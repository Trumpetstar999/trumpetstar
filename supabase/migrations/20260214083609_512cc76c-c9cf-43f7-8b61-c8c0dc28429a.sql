
-- practice_sessions
CREATE TABLE public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  break_enabled boolean NOT NULL DEFAULT true,
  break_seconds_default integer NOT NULL DEFAULT 60,
  is_public boolean NOT NULL DEFAULT false,
  share_slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.practice_sessions FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Anyone can view public sessions"
  ON public.practice_sessions FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create own sessions"
  ON public.practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own sessions"
  ON public.practice_sessions FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.practice_sessions FOR DELETE
  USING (auth.uid() = owner_user_id);

CREATE TRIGGER update_practice_sessions_updated_at
  BEFORE UPDATE ON public.practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- practice_session_sections
CREATE TABLE public.practice_session_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  section_key text NOT NULL DEFAULT 'custom',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_session_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sections of own sessions"
  ON public.practice_session_sections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = session_id AND (ps.owner_user_id = auth.uid() OR ps.is_public = true)
  ));

CREATE POLICY "Users can insert sections in own sessions"
  ON public.practice_session_sections FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = session_id AND ps.owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can update sections in own sessions"
  ON public.practice_session_sections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = session_id AND ps.owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sections in own sessions"
  ON public.practice_session_sections FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = session_id AND ps.owner_user_id = auth.uid()
  ));

-- practice_session_items
CREATE TABLE public.practice_session_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.practice_session_sections(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  item_type text NOT NULL,
  ref_id text,
  title_cache text,
  duration_mode text NOT NULL DEFAULT 'until_end',
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_session_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items of own sessions"
  ON public.practice_session_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = session_id AND (ps.owner_user_id = auth.uid() OR ps.is_public = true)
  ));

CREATE POLICY "Users can insert items in own sessions"
  ON public.practice_session_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = session_id AND ps.owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can update items in own sessions"
  ON public.practice_session_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = session_id AND ps.owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items in own sessions"
  ON public.practice_session_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = session_id AND ps.owner_user_id = auth.uid()
  ));

-- practice_session_shares
CREATE TABLE public.practice_session_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  shared_by_user_id uuid NOT NULL,
  shared_with_user_id uuid,
  share_link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_session_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares they sent or received"
  ON public.practice_session_shares FOR SELECT
  USING (auth.uid() = shared_by_user_id OR auth.uid() = shared_with_user_id);

CREATE POLICY "Users can create shares for own sessions"
  ON public.practice_session_shares FOR INSERT
  WITH CHECK (auth.uid() = shared_by_user_id AND EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = session_id AND ps.owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own shares"
  ON public.practice_session_shares FOR DELETE
  USING (auth.uid() = shared_by_user_id);
