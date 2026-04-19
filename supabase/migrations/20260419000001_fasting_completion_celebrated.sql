-- Add completion_celebrated to fasting_sessions so the gratification popup
-- fires once and only once — at the moment the user ends a fast.
ALTER TABLE fasting_sessions
ADD COLUMN IF NOT EXISTS completion_celebrated BOOLEAN DEFAULT FALSE;
