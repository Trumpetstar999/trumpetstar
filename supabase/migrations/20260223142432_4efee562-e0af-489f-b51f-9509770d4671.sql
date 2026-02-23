
-- Table to track friend referral invitations
CREATE TABLE public.referral_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_user_id UUID NOT NULL,
  invited_email TEXT NOT NULL,
  stars_awarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view their own invitations
CREATE POLICY "Users can view own referral invitations"
  ON public.referral_invitations FOR SELECT
  USING (auth.uid() = inviter_user_id);

-- Users can insert their own invitations
CREATE POLICY "Users can create referral invitations"
  ON public.referral_invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_user_id);

-- Index for fast lookups
CREATE INDEX idx_referral_invitations_inviter ON public.referral_invitations(inviter_user_id);
CREATE UNIQUE INDEX idx_referral_invitations_unique ON public.referral_invitations(inviter_user_id, invited_email);
