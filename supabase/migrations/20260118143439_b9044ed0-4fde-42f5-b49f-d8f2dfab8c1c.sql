-- STEP 1: Create security definer functions first
CREATE OR REPLACE FUNCTION public.is_chat_participant(_user_id uuid, _chat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.video_chat_participants
    WHERE user_id = _user_id
      AND chat_id = _chat_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_chat_creator(_user_id uuid, _chat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.video_chats
    WHERE id = _chat_id
      AND created_by = _user_id
  )
$$;

-- STEP 2: Drop ALL existing policies on both tables completely
DROP POLICY IF EXISTS "Users can view chat participants" ON public.video_chat_participants;
DROP POLICY IF EXISTS "Chat creators can add participants" ON public.video_chat_participants;
DROP POLICY IF EXISTS "Chat creators can remove participants" ON public.video_chat_participants;
DROP POLICY IF EXISTS "Participants can view chat participants" ON public.video_chat_participants;

DROP POLICY IF EXISTS "Participants can view their chats" ON public.video_chats;
DROP POLICY IF EXISTS "Admins can manage all chats" ON public.video_chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.video_chats;
DROP POLICY IF EXISTS "Admins can update chats" ON public.video_chats;
DROP POLICY IF EXISTS "Admins can delete chats" ON public.video_chats;

-- STEP 3: Create video_chats policies using security definer functions (no recursion)
CREATE POLICY "Users can create chats"
ON public.video_chats
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Participants can view their chats"
ON public.video_chats
FOR SELECT
USING (
  public.is_chat_participant(auth.uid(), id) 
  OR created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update chats"
ON public.video_chats
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete chats"
ON public.video_chats
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- STEP 4: Create video_chat_participants policies using security definer functions (no recursion)
CREATE POLICY "Participants can view chat participants"
ON public.video_chat_participants
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_chat_creator(auth.uid(), chat_id)
  OR public.is_chat_participant(auth.uid(), chat_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Chat creators can add participants"
ON public.video_chat_participants
FOR INSERT
WITH CHECK (
  public.is_chat_creator(auth.uid(), chat_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Chat creators can remove participants"
ON public.video_chat_participants
FOR DELETE
USING (
  public.is_chat_creator(auth.uid(), chat_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);