-- =====================================================
-- MUSIK-LERN-APP DATENBANKSCHEMA
-- =====================================================

-- 1. PROFILES TABLE (User-Daten)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  is_teacher BOOLEAN NOT NULL DEFAULT false,
  privacy_setting TEXT NOT NULL DEFAULT 'private' CHECK (privacy_setting IN ('private', 'friends', 'public')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger für automatische Profilerstellung bei Signup
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. LEVELS TABLE (Vimeo Showcases)
CREATE TABLE public.levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vimeo_showcase_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active levels" ON public.levels
  FOR SELECT USING (is_active = true);

-- 3. SECTIONS TABLE (Kategorien innerhalb eines Levels)
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES public.levels ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view sections" ON public.sections
  FOR SELECT USING (true);

-- 4. VIDEOS TABLE (Vimeo Videos)
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES public.levels ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections ON DELETE SET NULL,
  vimeo_video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  vimeo_player_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active videos" ON public.videos
  FOR SELECT USING (is_active = true);

-- 5. VIDEO COMPLETIONS TABLE (Abgeschlossene Videos = Stars)
CREATE TABLE public.video_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos ON DELETE CASCADE,
  playback_speed INTEGER NOT NULL DEFAULT 100,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completions" ON public.video_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions" ON public.video_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. USER VIDEO PROGRESS TABLE (Aktueller Fortschritt)
CREATE TABLE public.user_video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos ON DELETE CASCADE,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  playback_speed INTEGER NOT NULL DEFAULT 100,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.user_video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON public.user_video_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.user_video_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_video_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. JOURNAL ENTRIES TABLE (Üben-Journal)
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes INTEGER NOT NULL DEFAULT 0,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  notes TEXT,
  tags TEXT[],
  video_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal entries" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" ON public.journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- 8. TODOS TABLE (Aufgaben)
CREATE TABLE public.todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  due_date DATE,
  priority INTEGER NOT NULL DEFAULT 2 CHECK (priority >= 1 AND priority <= 3),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  journal_entry_id UUID REFERENCES public.journal_entries ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own todos" ON public.todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos" ON public.todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" ON public.todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" ON public.todos
  FOR DELETE USING (auth.uid() = user_id);

-- 9. USER RECORDINGS TABLE (Eigene Videoaufnahmen)
CREATE TABLE public.user_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT,
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recordings" ON public.user_recordings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings" ON public.user_recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings" ON public.user_recordings
  FOR DELETE USING (auth.uid() = user_id);

-- 10. RECORDING SHARES TABLE (Geteilte Aufnahmen)
CREATE TABLE public.recording_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID NOT NULL REFERENCES public.user_recordings ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(recording_id, shared_with_user_id)
);

ALTER TABLE public.recording_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recording owners can view shares" ON public.recording_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_recordings 
      WHERE id = recording_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Shared users can view shares" ON public.recording_shares
  FOR SELECT USING (shared_with_user_id = auth.uid());

CREATE POLICY "Recording owners can create shares" ON public.recording_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_recordings 
      WHERE id = recording_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Recording owners can delete shares" ON public.recording_shares
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_recordings 
      WHERE id = recording_id AND user_id = auth.uid()
    )
  );

-- Users can view recordings shared with them
CREATE POLICY "Users can view shared recordings" ON public.user_recordings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recording_shares 
      WHERE recording_id = id AND shared_with_user_id = auth.uid()
    )
  );

-- 11. FRIENDSHIPS TABLE
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their friendships" ON public.friendships
  FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

CREATE POLICY "Users can delete their friendships" ON public.friendships
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 12. CLASSROOMS TABLE (Online-Klassenzimmer)
CREATE TABLE public.classrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT,
  visibility TEXT NOT NULL DEFAULT 'invite' CHECK (visibility IN ('invite', 'friends', 'link')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  is_live BOOLEAN NOT NULL DEFAULT false,
  is_recording BOOLEAN NOT NULL DEFAULT false,
  max_participants INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their classrooms" ON public.classrooms
  FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Hosts can create classrooms" ON public.classrooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their classrooms" ON public.classrooms
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their classrooms" ON public.classrooms
  FOR DELETE USING (auth.uid() = host_id);

-- 13. CLASSROOM PARTICIPANTS TABLE
CREATE TABLE public.classroom_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(classroom_id, user_id)
);

ALTER TABLE public.classroom_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view participants" ON public.classroom_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classrooms 
      WHERE id = classroom_id AND host_id = auth.uid()
    )
  );

CREATE POLICY "Participants can view their participation" ON public.classroom_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Hosts can invite participants" ON public.classroom_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classrooms 
      WHERE id = classroom_id AND host_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update their participation" ON public.classroom_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Participants can view classrooms they're invited to
CREATE POLICY "Participants can view classrooms" ON public.classrooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classroom_participants 
      WHERE classroom_id = id AND user_id = auth.uid()
    )
  );

-- 14. VIMEO SYNC LOG TABLE (Admin-Überwachung)
CREATE TABLE public.vimeo_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID REFERENCES public.levels ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  videos_added INTEGER NOT NULL DEFAULT 0,
  videos_updated INTEGER NOT NULL DEFAULT 0,
  videos_deactivated INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vimeo_sync_log ENABLE ROW LEVEL SECURITY;

-- Public read for sync status (admin checks this)
CREATE POLICY "Everyone can view sync logs" ON public.vimeo_sync_log
  FOR SELECT USING (true);

-- 15. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_levels_updated_at
  BEFORE UPDATE ON public.levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();