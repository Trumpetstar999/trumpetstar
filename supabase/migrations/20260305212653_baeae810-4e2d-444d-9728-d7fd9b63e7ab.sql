
-- Drop the foreign key constraint on user_id (references auth.users)
ALTER TABLE public.digistore24_subscriptions
  DROP CONSTRAINT IF EXISTS digistore24_subscriptions_user_id_fkey;

-- Make user_id nullable so CSV-imported subscriptions without an Auth account can be stored
ALTER TABLE public.digistore24_subscriptions
  ALTER COLUMN user_id DROP NOT NULL;
