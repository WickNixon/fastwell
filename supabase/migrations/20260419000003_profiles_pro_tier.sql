-- Update profiles for new free/pro/member_pro subscription model.
-- The old 'member'/'subscriber'/'inactive' tier values are replaced.

-- Step 1: Add the new subscription_tier column with a default of 'free'.
-- Note: the old column may already exist with old CHECK constraints.
-- We drop the old constraint and recreate with new values.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';

-- Drop old constraint if it exists, then add the new one.
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'member_pro'));

-- Step 2: Pro trial timestamps
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pro_trial_started_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pro_trial_ends_at TIMESTAMPTZ;
