-- ============================================================
-- Add memo + emoji to health_entries
-- ============================================================
ALTER TABLE health_entries ADD COLUMN IF NOT EXISTS memo TEXT;
ALTER TABLE health_entries ADD COLUMN IF NOT EXISTS emoji TEXT;

-- ============================================================
-- food_logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS food_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  logged_at    TIMESTAMPTZ DEFAULT NOW(),
  meal_type    TEXT,
  description  TEXT,
  photo_url    TEXT,
  calories     NUMERIC,
  protein_g    NUMERIC,
  carbs_g      NUMERIC,
  fat_g        NUMERIC,
  fibre_g      NUMERIC,
  notes        TEXT,
  source       TEXT DEFAULT 'manual',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_logs_select_own" ON food_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "food_logs_insert_own" ON food_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "food_logs_update_own" ON food_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "food_logs_delete_own" ON food_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, logged_at DESC);
