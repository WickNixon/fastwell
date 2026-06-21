-- ============================================================
-- Subscription tier reconciliation
-- 20260621000000_subscription_tier_backfill.sql
--
-- Migration 20260419000003 was never applied to production, so
-- the live constraint is still the old ('member','subscriber','inactive')
-- set and the pro_trial timestamp columns do not yet exist.
--
-- This migration supersedes 20260419000003. It:
--   1. Drops the old CHECK constraint
--   2. Backfills old tier values to the canonical new set
--   3. Re-adds the constraint with canonical values
--   4. Adds pro_trial_started_at and pro_trial_ends_at columns
-- ============================================================

-- Step 1: Drop old CHECK constraint
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

-- Step 2: Backfill old tier values to canonical values
--   'member'   → 'member_pro'  (Wicked Wellbeing community member)
--   'subscriber' → 'pro'       (paying non-member)
--   'inactive'   → 'free'      (no active paid access)
UPDATE profiles SET subscription_tier = 'member_pro' WHERE subscription_tier = 'member';
UPDATE profiles SET subscription_tier = 'pro'        WHERE subscription_tier = 'subscriber';
UPDATE profiles SET subscription_tier = 'free'       WHERE subscription_tier = 'inactive';

-- Step 3: Re-add constraint with canonical value set
-- Column is nullable — do not change nullability here.
ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'member_pro'));

-- Step 4: Add pro trial timestamp columns (from 20260419000003, never applied)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pro_trial_started_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pro_trial_ends_at TIMESTAMPTZ;
