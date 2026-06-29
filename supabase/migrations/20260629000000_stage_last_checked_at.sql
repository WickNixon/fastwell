-- Add stage_last_checked_at to profiles so the Learn tab can track
-- when the user last confirmed their menopause stage.
-- Set at onboarding completion and whenever the re-check is completed.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stage_last_checked_at TIMESTAMPTZ;
