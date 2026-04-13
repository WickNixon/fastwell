-- ============================================================
-- Fastwell — Initial Schema
-- 20250414000000_initial_schema.sql
-- ============================================================

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name               TEXT,
  first_name              TEXT,
  date_of_birth           DATE,
  age                     INTEGER,
  menopause_stage         TEXT CHECK (menopause_stage IN (
                            'perimenopause', 'transition', 'post_menopause', 'not_sure'
                          )),
  has_regular_cycle       TEXT CHECK (has_regular_cycle IN (
                            'yes_regular', 'yes_irregular', 'no'
                          )),
  cycle_length_days       INTEGER,
  on_hrt                  TEXT CHECK (on_hrt IN ('yes', 'no', 'not_sure')),
  primary_goal            TEXT CHECK (primary_goal IN (
                            'energy', 'sleep', 'weight_loss',
                            'hormonal_balance', 'blood_sugar', 'all'
                          )),
  theme_preference        TEXT DEFAULT 'system',
  subscription_tier       TEXT CHECK (subscription_tier IN (
                            'member', 'subscriber', 'inactive'
                          )) DEFAULT 'inactive',
  trial_ends_at           TIMESTAMPTZ,
  trial_reminder_sent     BOOLEAN DEFAULT FALSE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  subscription_status     TEXT,
  role                    TEXT DEFAULT 'user',
  timezone                TEXT DEFAULT 'Pacific/Auckland',
  weight_unit             TEXT DEFAULT 'kg',
  onboarding_complete     BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVITE TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS invite_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  email       TEXT NOT NULL,
  first_name  TEXT,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  used_at     TIMESTAMPTZ,
  is_used     BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- MEMBERSHIP WHITELIST
-- ============================================================
CREATE TABLE IF NOT EXISTS membership_whitelist (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email     TEXT UNIQUE NOT NULL,
  added_by  UUID REFERENCES profiles(id),
  added_at  TIMESTAMPTZ DEFAULT NOW(),
  notes     TEXT
);

-- ============================================================
-- FASTING SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS fasting_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  protocol         TEXT,
  started_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,
  duration_minutes INTEGER,
  broken_by        TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HEALTH ENTRIES
-- One row per metric per day per user per source
-- ============================================================
CREATE TABLE IF NOT EXISTS health_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  entry_date  DATE NOT NULL,
  metric      TEXT NOT NULL,
  value       NUMERIC,
  value_text  TEXT,
  unit        TEXT,
  source      TEXT DEFAULT 'manual',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date, metric, source)
);

-- ============================================================
-- SYMPTOMS LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS symptoms_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  entry_date  DATE NOT NULL,
  symptom     TEXT NOT NULL CHECK (symptom IN (
                'hot_flush', 'night_sweats', 'brain_fog', 'joint_pain',
                'anxiety', 'bloating', 'headache', 'fatigue',
                'mood_swings', 'low_libido', 'vaginal_dryness',
                'hair_thinning', 'insomnia'
              )),
  severity    INTEGER CHECK (severity BETWEEN 1 AND 5),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BIOMARKERS
-- ============================================================
CREATE TABLE IF NOT EXISTS biomarkers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  marker       TEXT NOT NULL CHECK (marker IN (
                 'hba1c', 'blood_glucose', 'ketones_blood', 'ketones_breath',
                 'cholesterol_total', 'vitamin_d', 'iron'
               )),
  value        NUMERIC NOT NULL,
  unit         TEXT NOT NULL,
  reading_date DATE NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUPPLEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS supplements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT CHECK (type IN (
                'supplement', 'hrt_bioidentical',
                'hrt_pharmaceutical', 'medication', 'other'
              )),
  dose        TEXT,
  frequency   TEXT,
  delivery    TEXT,
  brand       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  started_at  DATE,
  paused_at   DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FASTING PLANS (v1.1 — structure created in MVP, feature in 1.1)
-- ============================================================
CREATE TABLE IF NOT EXISTS fasting_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  cycle_phase     TEXT,
  planned_days    JSONB,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI INSIGHTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  insight_text  TEXT NOT NULL,
  insight_type  TEXT,
  data_snapshot JSONB,
  generated_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  shown_at      TIMESTAMPTZ,
  dismissed_at  TIMESTAMPTZ
);

-- ============================================================
-- USER BADGES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_key   TEXT NOT NULL,
  badge_name  TEXT NOT NULL,
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  seen        BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, badge_key)
);

-- ============================================================
-- INTEGRATION TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS integration_tokens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider         TEXT NOT NULL,
  access_token     TEXT,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  provider_user_id TEXT,
  is_active        BOOLEAN DEFAULT TRUE,
  last_sync_at     TIMESTAMPTZ,
  last_sync_error  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- ============================================================
-- NOTIFICATIONS LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications_log (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sent_by   UUID REFERENCES profiles(id),
  type      TEXT,
  title     TEXT,
  body      TEXT,
  sent_at   TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ
);

-- ============================================================
-- EMAIL LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS email_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email_type  TEXT NOT NULL CHECK (email_type IN (
                'invite', 'trial_end_member', 'trial_end_subscriber',
                'password_reset', 'payment_failed'
              )),
  to_email    TEXT NOT NULL,
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  resend_id   TEXT,
  failed      BOOLEAN DEFAULT FALSE,
  error       TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_health_entries_user_date   ON health_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_user      ON fasting_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_biomarkers_user_date       ON biomarkers(user_id, reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_symptoms_user_date         ON symptoms_log(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user           ON user_badges(user_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user           ON ai_insights(user_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires        ON ai_insights(expires_at);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token        ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer   ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends        ON profiles(trial_ends_at) WHERE subscription_tier IN ('member', 'subscriber');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_whitelist  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomarkers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_tokens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log             ENABLE ROW LEVEL SECURITY;

-- ----------------
-- profiles RLS
-- ----------------
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------
-- invite_tokens RLS (admin only)
-- ----------------
CREATE POLICY "invite_tokens_admin_all" ON invite_tokens
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow unauthenticated read for token validation (token is secret by nature)
CREATE POLICY "invite_tokens_anon_select" ON invite_tokens
  FOR SELECT USING (true);

-- ----------------
-- membership_whitelist RLS (admin only)
-- ----------------
CREATE POLICY "membership_whitelist_admin_all" ON membership_whitelist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----------------
-- fasting_sessions RLS
-- ----------------
CREATE POLICY "fasting_sessions_select_own" ON fasting_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "fasting_sessions_insert_own" ON fasting_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fasting_sessions_update_own" ON fasting_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fasting_sessions_delete_own" ON fasting_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------
-- health_entries RLS
-- ----------------
CREATE POLICY "health_entries_select_own" ON health_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "health_entries_insert_own" ON health_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "health_entries_update_own" ON health_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "health_entries_delete_own" ON health_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------
-- symptoms_log RLS
-- ----------------
CREATE POLICY "symptoms_log_select_own" ON symptoms_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "symptoms_log_insert_own" ON symptoms_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "symptoms_log_update_own" ON symptoms_log
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "symptoms_log_delete_own" ON symptoms_log
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------
-- biomarkers RLS
-- ----------------
CREATE POLICY "biomarkers_select_own" ON biomarkers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "biomarkers_insert_own" ON biomarkers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "biomarkers_update_own" ON biomarkers
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "biomarkers_delete_own" ON biomarkers
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------
-- supplements RLS
-- ----------------
CREATE POLICY "supplements_select_own" ON supplements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "supplements_insert_own" ON supplements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "supplements_update_own" ON supplements
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "supplements_delete_own" ON supplements
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------
-- fasting_plans RLS
-- ----------------
CREATE POLICY "fasting_plans_select_own" ON fasting_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "fasting_plans_insert_own" ON fasting_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fasting_plans_update_own" ON fasting_plans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fasting_plans_delete_own" ON fasting_plans
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------
-- ai_insights RLS
-- ----------------
CREATE POLICY "ai_insights_select_own" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_insights_insert_own" ON ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_insights_update_own" ON ai_insights
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role inserts (Edge Function) bypasses RLS by design
-- ai_insights: allow service role (no auth.uid()) for Edge Function inserts
CREATE POLICY "ai_insights_service_insert" ON ai_insights
  FOR INSERT WITH CHECK (true);

-- ----------------
-- user_badges RLS
-- ----------------
CREATE POLICY "user_badges_select_own" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_badges_insert_own" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_badges_update_own" ON user_badges
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role badge awarding via Edge Functions
CREATE POLICY "user_badges_service_insert" ON user_badges
  FOR INSERT WITH CHECK (true);

-- ----------------
-- integration_tokens RLS
-- ----------------
CREATE POLICY "integration_tokens_select_own" ON integration_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "integration_tokens_insert_own" ON integration_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_tokens_update_own" ON integration_tokens
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_tokens_delete_own" ON integration_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------
-- notifications_log RLS
-- ----------------
CREATE POLICY "notifications_log_select_own" ON notifications_log
  FOR SELECT USING (auth.uid() = user_id);

-- ----------------
-- email_log RLS (service role only — no direct user access)
-- ----------------
CREATE POLICY "email_log_admin_select" ON email_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER health_entries_updated_at
  BEFORE UPDATE ON health_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER supplements_updated_at
  BEFORE UPDATE ON supplements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PROFILE AUTO-CREATE ON AUTH SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- BADGE TRIGGER: onboarding_complete
-- ============================================================
CREATE OR REPLACE FUNCTION award_onboarding_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.onboarding_complete = TRUE AND OLD.onboarding_complete = FALSE THEN
    INSERT INTO user_badges (user_id, badge_key, badge_name)
    VALUES (NEW.id, 'onboarding_complete', 'You showed up')
    ON CONFLICT (user_id, badge_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_onboarding_complete
  AFTER UPDATE OF onboarding_complete ON profiles
  FOR EACH ROW EXECUTE FUNCTION award_onboarding_badge();

-- ============================================================
-- BADGE TRIGGER: first_fast
-- ============================================================
CREATE OR REPLACE FUNCTION award_first_fast_badge()
RETURNS TRIGGER AS $$
DECLARE
  session_count INTEGER;
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    SELECT COUNT(*) INTO session_count
    FROM fasting_sessions
    WHERE user_id = NEW.user_id AND ended_at IS NOT NULL;

    IF session_count = 1 THEN
      INSERT INTO user_badges (user_id, badge_key, badge_name)
      VALUES (NEW.user_id, 'first_fast', 'First fast')
      ON CONFLICT (user_id, badge_key) DO NOTHING;
    END IF;

    -- Check for deep fast (24+ hours = 1440+ minutes)
    IF NEW.duration_minutes >= 1440 THEN
      INSERT INTO user_badges (user_id, badge_key, badge_name)
      VALUES (NEW.user_id, 'deep_fast', 'Going deep')
      ON CONFLICT (user_id, badge_key) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_fast_completed
  AFTER UPDATE OF ended_at ON fasting_sessions
  FOR EACH ROW EXECUTE FUNCTION award_first_fast_badge();

-- ============================================================
-- BADGE TRIGGER: know_your_numbers (first HbA1c)
-- ============================================================
CREATE OR REPLACE FUNCTION award_hba1c_badge()
RETURNS TRIGGER AS $$
DECLARE
  hba1c_count INTEGER;
  first_value NUMERIC;
BEGIN
  IF NEW.marker = 'hba1c' THEN
    SELECT COUNT(*) INTO hba1c_count
    FROM biomarkers
    WHERE user_id = NEW.user_id AND marker = 'hba1c';

    IF hba1c_count = 1 THEN
      INSERT INTO user_badges (user_id, badge_key, badge_name)
      VALUES (NEW.user_id, 'know_your_numbers', 'Know your numbers')
      ON CONFLICT (user_id, badge_key) DO NOTHING;
    END IF;

    -- Check if improved vs first reading
    IF hba1c_count > 1 THEN
      SELECT value INTO first_value
      FROM biomarkers
      WHERE user_id = NEW.user_id AND marker = 'hba1c'
      ORDER BY reading_date ASC
      LIMIT 1;

      IF NEW.value < first_value THEN
        INSERT INTO user_badges (user_id, badge_key, badge_name)
        VALUES (NEW.user_id, 'hba1c_improved', 'Your body is responding')
        ON CONFLICT (user_id, badge_key) DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_biomarker_insert
  AFTER INSERT ON biomarkers
  FOR EACH ROW EXECUTE FUNCTION award_hba1c_badge();
