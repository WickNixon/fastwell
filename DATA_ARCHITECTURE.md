# DATA_ARCHITECTURE.md — Fastwell

## Database: Supabase (PostgreSQL)

All tables use Row Level Security (RLS). Users can only read and write their own rows unless noted.

---

## Table: `profiles`

```sql
CREATE TABLE profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name             TEXT,
  first_name            TEXT,
  date_of_birth         DATE,
  age                   INTEGER,
  menopause_stage       TEXT CHECK (menopause_stage IN (
                          'perimenopause', 'transition', 'post_menopause', 'not_sure'
                        )),
  has_regular_cycle     TEXT CHECK (has_regular_cycle IN (
                          'yes_regular', 'yes_irregular', 'no'
                        )),
  cycle_length_days     INTEGER,
  on_hrt                TEXT CHECK (on_hrt IN ('yes', 'no', 'not_sure')),
  primary_goal          TEXT CHECK (primary_goal IN (
                          'energy', 'sleep', 'weight_loss',
                          'hormonal_balance', 'blood_sugar', 'all'
                        )),
  theme_preference      TEXT DEFAULT 'system',
  subscription_tier     TEXT CHECK (subscription_tier IN (
                          'member', 'subscriber', 'inactive'
                        )) DEFAULT 'inactive',
  trial_ends_at         TIMESTAMPTZ,
  trial_reminder_sent   BOOLEAN DEFAULT FALSE,
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  subscription_status   TEXT,
  role                  TEXT DEFAULT 'user',
  timezone              TEXT DEFAULT 'Pacific/Auckland',
  weight_unit           TEXT DEFAULT 'kg',
  onboarding_complete   BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Table: `invite_tokens`

Single-use member invite links generated from admin dashboard.

```sql
CREATE TABLE invite_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  email         TEXT NOT NULL,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  used_at       TIMESTAMPTZ,
  is_used       BOOLEAN DEFAULT FALSE
);
```

---

## Table: `membership_whitelist`

```sql
CREATE TABLE membership_whitelist (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email     TEXT UNIQUE NOT NULL,
  added_by  UUID REFERENCES profiles(id),
  added_at  TIMESTAMPTZ DEFAULT NOW(),
  notes     TEXT
);
```

---

## Table: `fasting_sessions`

```sql
CREATE TABLE fasting_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES profiles(id) NOT NULL,
  protocol         TEXT,
  started_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,
  duration_minutes INTEGER,
  broken_by        TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Table: `health_entries`

One row per metric per day per user per source.

```sql
CREATE TABLE health_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) NOT NULL,
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
```

### Metric Reference

| metric | unit | notes |
|---|---|---|
| `weight` | kg | |
| `waist_cm` | cm | |
| `hips_cm` | cm | |
| `steps` | count | |
| `sleep_hours` | hours | |
| `sleep_quality` | 1–5 | |
| `water_ml` | ml | |
| `exercise_minutes` | minutes | |
| `exercise_type` | text | |
| `exercise_intensity` | 1–3 | |
| `energy_level` | 1–5 | |
| `mood` | 1–5 | |
| `heart_rate_resting` | bpm | |
| `hrv` | ms | Garmin |
| `stress_score` | 0–100 | Garmin |
| `body_battery` | 0–100 | Garmin |

---

## Table: `symptoms_log`

```sql
CREATE TABLE symptoms_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) NOT NULL,
  entry_date  DATE NOT NULL,
  symptom     TEXT NOT NULL,
  severity    INTEGER CHECK (severity BETWEEN 1 AND 5),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Symptom Types
`hot_flush` | `night_sweats` | `brain_fog` | `joint_pain` | `anxiety` | `bloating` | `headache` | `fatigue` | `mood_swings` | `low_libido` | `vaginal_dryness` | `hair_thinning` | `insomnia`

---

## Table: `biomarkers`

```sql
CREATE TABLE biomarkers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) NOT NULL,
  marker       TEXT NOT NULL,
  value        NUMERIC NOT NULL,
  unit         TEXT NOT NULL,
  reading_date DATE NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### Biomarker Types

| marker | unit | description |
|---|---|---|
| `hba1c` | % or mmol/mol | 3-month blood sugar average |
| `blood_glucose` | mmol/L | fasting glucose reading |
| `ketones_blood` | mmol/L | blood ketone meter |
| `ketones_breath` | ppm | breath ketone meter |
| `cholesterol_total` | mmol/L | optional |
| `vitamin_d` | nmol/L | optional |
| `iron` | µmol/L | optional |

---

## Table: `supplements`

```sql
CREATE TABLE supplements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) NOT NULL,
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
```

---

## Table: `fasting_plans`

```sql
CREATE TABLE fasting_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) NOT NULL,
  week_start_date DATE NOT NULL,
  cycle_phase     TEXT,
  planned_days    JSONB,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Table: `ai_insights`

Cached AI insight cards generated by the Claude API.

```sql
CREATE TABLE ai_insights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) NOT NULL,
  insight_text  TEXT NOT NULL,
  insight_type  TEXT,           -- 'sleep_fast' | 'energy' | 'hydration' | 'hba1c' | 'symptom' | 'general'
  data_snapshot JSONB,          -- the data used to generate this insight (for audit)
  generated_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  shown_at      TIMESTAMPTZ,    -- when user saw it
  dismissed_at  TIMESTAMPTZ     -- if user dismissed it
);
```

---

## Table: `user_badges`

```sql
CREATE TABLE user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) NOT NULL,
  badge_key   TEXT NOT NULL,
  badge_name  TEXT NOT NULL,
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  seen        BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, badge_key)
);
```

### Badge Reference

| badge_key | badge_name | trigger |
|---|---|---|
| `onboarding_complete` | You showed up | Complete onboarding |
| `first_fast` | First fast | First fasting session logged |
| `know_your_numbers` | Know your numbers | First HbA1c entered |
| `momentum_7` | Building momentum | Log any habit 7 consecutive days |
| `lifestyle_30` | This is who you are now | Log any habit 30 consecutive days |
| `deep_fast` | Going deep | Complete a 24hr+ fast |
| `hydration_7` | Hydration queen | Log water 7 days in a row |
| `first_export` | Taking control | First GP export generated |
| `hba1c_improved` | Your body is responding | HbA1c improves vs first reading |
| `three_months` | Three months stronger | 3 months since first log |
| `six_months` | Half a year of you | 6 months since first log |

---

## Table: `integration_tokens`

```sql
CREATE TABLE integration_tokens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES profiles(id) NOT NULL,
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
```

---

## Table: `notifications_log`

```sql
CREATE TABLE notifications_log (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES profiles(id) NOT NULL,
  sent_by   UUID REFERENCES profiles(id),
  type      TEXT,
  title     TEXT,
  body      TEXT,
  sent_at   TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ
);
```

---

## Table: `email_log`

Tracks all Resend emails sent — for debugging and avoiding duplicates.

```sql
CREATE TABLE email_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  email_type  TEXT NOT NULL,   -- 'invite' | 'trial_end_member' | 'trial_end_subscriber' | 'password_reset' | 'payment_failed'
  to_email    TEXT NOT NULL,
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  resend_id   TEXT,            -- Resend's message ID for tracking
  failed      BOOLEAN DEFAULT FALSE,
  error       TEXT
);
```

---

## RLS Policies

```sql
-- Users access own data only
CREATE POLICY "users_select_own" ON health_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own" ON health_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Same pattern on: fasting_sessions, symptoms_log, biomarkers,
-- supplements, fasting_plans, ai_insights, user_badges, integration_tokens

-- Admins can read all profiles (activity only — not health data)
CREATE POLICY "admins_read_all_profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## Key Indexes

```sql
CREATE INDEX idx_health_entries_user_date ON health_entries(user_id, entry_date DESC);
CREATE INDEX idx_fasting_sessions_user ON fasting_sessions(user_id, started_at DESC);
CREATE INDEX idx_biomarkers_user_date ON biomarkers(user_id, reading_date DESC);
CREATE INDEX idx_symptoms_user_date ON symptoms_log(user_id, entry_date DESC);
CREATE INDEX idx_user_badges_user ON user_badges(user_id, earned_at DESC);
CREATE INDEX idx_ai_insights_user ON ai_insights(user_id, generated_at DESC);
CREATE INDEX idx_invite_tokens_token ON invite_tokens(token);
```
