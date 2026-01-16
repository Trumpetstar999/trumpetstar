-- Drop the old check constraint
ALTER TABLE public.user_memberships DROP CONSTRAINT IF EXISTS user_memberships_current_plan_check;

-- Add a new, more flexible check constraint that allows any value
-- (we use plan_key for logic anyway, current_plan is just for display)