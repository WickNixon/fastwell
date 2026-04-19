-- Ensure health_entries has a memo column for free-text notes
-- (e.g. used by Review your day, habit quick-tick notes)
ALTER TABLE health_entries ADD COLUMN IF NOT EXISTS memo TEXT;
