
-- Teacher assignment: Each user has exactly one active teacher
CREATE TABLE public.teacher_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, is_active) -- Only one active teacher per user
);

-- Video chats: Each chat is bound to exactly ONE video
CREATE TABLE public.video_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  context_type TEXT NOT NULL CHECK (context_type IN ('user_video', 'teacher_discussion', 'admin_feedback')),
  reference_video_id UUID REFERENCES public.user_recordings(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat participants to track who has access
CREATE TABLE public.video_chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.video_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'teacher', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

-- Chat messages with support for text, video, and markers
CREATE TABLE public.video_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.video_chats(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'teacher', 'admin')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'video', 'marker')),
  content TEXT,
  video_storage_path TEXT,
  timestamp_seconds INTEGER, -- For markers: position in the reference video
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Admin feedback requests
CREATE TABLE public.admin_feedback_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_video_id UUID NOT NULL REFERENCES public.user_recordings(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  chat_id UUID REFERENCES public.video_chats(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Video shares: Track which videos are shared with whom
CREATE TABLE public.video_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.user_recordings(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('teacher', 'admin')),
  chat_id UUID REFERENCES public.video_chats(id) ON DELETE SET NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(video_id, shared_with_user_id, share_type)
);

-- Enable RLS on all tables
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_shares ENABLE ROW LEVEL SECURITY;

-- Teacher assignments policies
CREATE POLICY "Users can view their own teacher assignment"
ON public.teacher_assignments FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = teacher_id);

CREATE POLICY "Admins can manage teacher assignments"
ON public.teacher_assignments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Video chats policies
CREATE POLICY "Participants can view their chats"
ON public.video_chats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.video_chat_participants
    WHERE chat_id = video_chats.id AND user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create chats"
ON public.video_chats FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all chats"
ON public.video_chats FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Chat participants policies
CREATE POLICY "Participants can view chat participants"
ON public.video_chat_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.video_chat_participants p
    WHERE p.chat_id = video_chat_participants.chat_id AND p.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Chat creators can add participants"
ON public.video_chat_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.video_chats
    WHERE id = chat_id AND created_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Chat messages policies
CREATE POLICY "Participants can view messages"
ON public.video_chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.video_chat_participants
    WHERE chat_id = video_chat_messages.chat_id AND user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Participants can send messages"
ON public.video_chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_user_id
  AND EXISTS (
    SELECT 1 FROM public.video_chat_participants
    WHERE chat_id = video_chat_messages.chat_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage messages"
ON public.video_chat_messages FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Admin feedback requests policies
CREATE POLICY "Users can view their own feedback requests"
ON public.admin_feedback_requests FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create feedback requests"
ON public.admin_feedback_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update feedback requests"
ON public.admin_feedback_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Video shares policies
CREATE POLICY "Users can view shares for their videos or shared with them"
ON public.video_shares FOR SELECT
USING (
  auth.uid() = shared_by_user_id 
  OR auth.uid() = shared_with_user_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can share their own videos"
ON public.video_shares FOR INSERT
WITH CHECK (
  auth.uid() = shared_by_user_id
  AND EXISTS (
    SELECT 1 FROM public.user_recordings
    WHERE id = video_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can revoke their own shares"
ON public.video_shares FOR UPDATE
USING (auth.uid() = shared_by_user_id);

-- Triggers for updated_at
CREATE TRIGGER update_video_chats_updated_at
BEFORE UPDATE ON public.video_chats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_feedback_requests_updated_at
BEFORE UPDATE ON public.admin_feedback_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add is_teacher column to profiles if not exists (for role identification)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_teacher BOOLEAN DEFAULT false;

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_chat_messages;
