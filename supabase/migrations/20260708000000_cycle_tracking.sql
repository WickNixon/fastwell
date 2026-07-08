-- ============================================================
-- Fastwell — Cycle & Symptom Tracking
-- 20260708000000_cycle_tracking.sql
-- Additive only. Everything nullable/optional.
-- ============================================================

-- Manual override for which version of the Tracking page a user sees.
-- NULL = auto (derived from profiles.menopause_stage + has_regular_cycle).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cycle_tracking_mode TEXT CHECK (cycle_tracking_mode IN ('period', 'symptom'));

-- ============================================================
-- PERIOD LOGS
-- One row per user per calendar day that has a period status logged.
-- symptoms_log (existing table) already supports real 1-5 severity —
-- the "hardcoded 3" bug was in application code, not the schema, and is
-- fixed there. No schema change needed for symptoms.
-- ============================================================
CREATE TABLE IF NOT EXISTS period_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  entry_date  DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('start', 'ongoing', 'end')),
  flow        TEXT CHECK (flow IN ('light', 'medium', 'heavy')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_period_logs_user_date ON period_logs(user_id, entry_date DESC);

ALTER TABLE period_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "period_logs_select_own" ON period_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "period_logs_insert_own" ON period_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "period_logs_update_own" ON period_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "period_logs_delete_own" ON period_logs
  FOR DELETE USING (auth.uid() = user_id);
