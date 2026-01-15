-- Create activity_logs table for tracking user activities
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'login', 'video_played', 'star_earned', 'recording_created', 'classroom_joined'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all activity logs
CREATE POLICY "Admins can read activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert their own activity logs
CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);

-- Create a view for admin dashboard stats
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(DISTINCT user_id) FROM public.activity_logs WHERE created_at > NOW() - INTERVAL '24 hours') as active_today,
  (SELECT COUNT(DISTINCT user_id) FROM public.activity_logs WHERE created_at > NOW() - INTERVAL '7 days') as active_this_week,
  (SELECT COUNT(*) FROM public.video_completions) as total_stars;