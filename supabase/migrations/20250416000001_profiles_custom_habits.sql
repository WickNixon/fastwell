-- Add custom_habits JSONB column to profiles
-- Stores per-user habit goal overrides: { "exercise": { "goal": 45, "unit": "mins" }, ... }
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_habits JSONB DEFAULT '{}';
