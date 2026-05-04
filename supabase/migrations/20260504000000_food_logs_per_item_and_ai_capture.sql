-- ============================================================
-- Reconcile food_logs migration drift + add AI capture columns
-- ============================================================
-- The 20250416000000 migration created food_logs with columns
-- that differ from what the live schema actually has. This migration
-- adds the live columns to migration history (no-ops on prod) and
-- extends the table with three new jsonb capture columns.

-- Columns that exist live but were never tracked in migrations
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS meal_name TEXT;
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS confidence TEXT;

-- AI capture columns — new
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS ai_original_payload JSONB;
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS ai_corrections JSONB;
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS final_payload JSONB;
