-- Add push_token to profiles for Expo Push Notifications
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Index for fast lookups when sending batch notifications
CREATE INDEX IF NOT EXISTS profiles_push_token_idx ON profiles (push_token)
  WHERE push_token IS NOT NULL;
