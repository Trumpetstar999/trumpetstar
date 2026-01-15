-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Users can view shared recordings" ON user_recordings;
DROP POLICY IF EXISTS "Recording owners can view shares" ON recording_shares;
DROP POLICY IF EXISTS "Recording owners can create shares" ON recording_shares;
DROP POLICY IF EXISTS "Recording owners can delete shares" ON recording_shares;

-- Create a security definer function to check recording ownership
CREATE OR REPLACE FUNCTION public.is_recording_owner(recording_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_recordings
    WHERE id = recording_id
      AND user_id = auth.uid()
  )
$$;

-- Create a security definer function to check if a recording is shared with the user
CREATE OR REPLACE FUNCTION public.is_recording_shared_with_me(recording_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.recording_shares
    WHERE recording_shares.recording_id = is_recording_shared_with_me.recording_id
      AND shared_with_user_id = auth.uid()
  )
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Users can view shared recordings"
ON user_recordings FOR SELECT
USING (public.is_recording_shared_with_me(id));

CREATE POLICY "Recording owners can view shares"
ON recording_shares FOR SELECT
USING (public.is_recording_owner(recording_id) OR shared_with_user_id = auth.uid());

CREATE POLICY "Recording owners can create shares"
ON recording_shares FOR INSERT
WITH CHECK (public.is_recording_owner(recording_id));

CREATE POLICY "Recording owners can delete shares"
ON recording_shares FOR DELETE
USING (public.is_recording_owner(recording_id));