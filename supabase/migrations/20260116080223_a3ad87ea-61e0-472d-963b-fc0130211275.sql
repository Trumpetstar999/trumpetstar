-- Create digimember_products table to store synced products
CREATE TABLE public.digimember_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT,
  checkout_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  app_plan TEXT CHECK (app_plan IN ('FREE', 'PLAN_A', 'PLAN_B')),
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.digimember_products ENABLE ROW LEVEL SECURITY;

-- Admin can manage products
CREATE POLICY "Admins can manage digimember products"
ON public.digimember_products
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Everyone can view active products (needed for upgrade links)
CREATE POLICY "Anyone can view active products"
ON public.digimember_products
FOR SELECT
USING (is_active = true);

-- Add required_plan column to levels table
ALTER TABLE public.levels 
ADD COLUMN IF NOT EXISTS required_plan TEXT CHECK (required_plan IN ('FREE', 'PLAN_A', 'PLAN_B')) DEFAULT 'FREE';

-- Create user_memberships table to cache user membership status
CREATE TABLE public.user_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wp_user_id TEXT,
  current_plan TEXT CHECK (current_plan IN ('FREE', 'PLAN_A', 'PLAN_B')) NOT NULL DEFAULT 'FREE',
  active_product_ids TEXT[] DEFAULT '{}',
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view their own membership
CREATE POLICY "Users can view own membership"
ON public.user_memberships
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own membership (for refresh)
CREATE POLICY "Users can update own membership"
ON public.user_memberships
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own membership
CREATE POLICY "Users can insert own membership"
ON public.user_memberships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all memberships
CREATE POLICY "Admins can manage all memberships"
ON public.user_memberships
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_digimember_products_updated_at
BEFORE UPDATE ON public.digimember_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_memberships_updated_at
BEFORE UPDATE ON public.user_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();