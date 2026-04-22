-- Add memo and emoji columns to health_entries for habit quick-tick notes and reactions
ALTER TABLE health_entries ADD COLUMN IF NOT EXISTS memo TEXT;
ALTER TABLE health_entries ADD COLUMN IF NOT EXISTS emoji TEXT;
