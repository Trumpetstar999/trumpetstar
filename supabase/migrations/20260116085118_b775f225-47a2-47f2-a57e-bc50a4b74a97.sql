-- ============================================
-- PLAN-SYSTEM MIGRATION
-- Plans: FREE (0), BASIC (10), PREMIUM (20)
-- ============================================

-- 1. Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  rank INTEGER NOT NULL DEFAULT 0,
  is_default_free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Plans are readable by everyone (needed for display)
CREATE POLICY "Plans are readable by everyone" 
ON public.plans FOR SELECT 
USING (true);

-- Only admins can modify plans
CREATE POLICY "Admins can manage plans" 
ON public.plans FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Insert initial plans
INSERT INTO public.plans (key, display_name, rank, is_default_free)
VALUES 
  ('FREE', 'Free', 0, true),
  ('BASIC', 'Basic', 10, false),
  ('PREMIUM', 'Premium', 20, false)
ON CONFLICT (key) DO NOTHING;

-- 2. Create product_plan_mapping table for flexible product-to-plan assignment
CREATE TABLE IF NOT EXISTS public.product_plan_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  digimember_product_id TEXT NOT NULL UNIQUE,
  plan_key TEXT NOT NULL DEFAULT 'NONE',
  checkout_url TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_plan_mapping ENABLE ROW LEVEL SECURITY;

-- Product mappings readable by everyone (needed to check access)
CREATE POLICY "Product mappings are readable by everyone" 
ON public.product_plan_mapping FOR SELECT 
USING (true);

-- Only admins can modify mappings
CREATE POLICY "Admins can manage product mappings" 
ON public.product_plan_mapping FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Update user_memberships table to use new plan keys
ALTER TABLE public.user_memberships 
  ADD COLUMN IF NOT EXISTS plan_key TEXT DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS plan_rank INTEGER DEFAULT 0;

-- 4. Update levels table to use required_plan_key
ALTER TABLE public.levels
  ADD COLUMN IF NOT EXISTS required_plan_key TEXT DEFAULT 'FREE';

-- Migrate existing required_plan data if it exists
UPDATE public.levels
SET required_plan_key = 
  CASE 
    WHEN required_plan = 'FREE' THEN 'FREE'
    WHEN required_plan = 'PLAN_A' THEN 'BASIC'
    WHEN required_plan = 'PLAN_B' THEN 'PREMIUM'
    ELSE 'FREE'
  END
WHERE required_plan IS NOT NULL AND required_plan_key = 'FREE';

-- 5. Create user_membership_cache for efficient plan lookups
CREATE TABLE IF NOT EXISTS public.user_membership_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL DEFAULT 'FREE',
  plan_rank INTEGER NOT NULL DEFAULT 0,
  active_product_ids JSONB DEFAULT '[]'::jsonb,
  last_checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_membership_cache ENABLE ROW LEVEL SECURITY;

-- Users can read their own cache
CREATE POLICY "Users can read their own membership cache" 
ON public.user_membership_cache FOR SELECT 
USING (auth.uid() = user_id);

-- Service role / system can update cache (handled via edge functions)
CREATE POLICY "Admins can manage membership cache" 
ON public.user_membership_cache FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Create trigger for updated_at on new tables
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_plan_mapping_updated_at
BEFORE UPDATE ON public.product_plan_mapping
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_membership_cache_updated_at
BEFORE UPDATE ON public.user_membership_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create admin dashboard view for plan stats
CREATE OR REPLACE VIEW public.admin_plan_stats AS
SELECT 
  p.key as plan_key,
  p.display_name,
  p.rank,
  COALESCE(COUNT(umc.id), 0) as user_count
FROM public.plans p
LEFT JOIN public.user_membership_cache umc ON umc.plan_key = p.key
GROUP BY p.key, p.display_name, p.rank
ORDER BY p.rank;