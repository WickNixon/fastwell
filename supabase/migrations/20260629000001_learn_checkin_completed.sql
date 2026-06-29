-- JSONB keyed by LearnStageId → ISO timestamp string of last completion.
-- e.g. { "perimenopause": "2026-06-29T10:00:00Z", "post_menopause": "2026-06-30T..." }
-- A stage change naturally invalidates: if profiles.menopause_stage changes,
-- the Learn tab derives forYouId from the new stage, which won't have a key
-- in this object yet (unless it was previously completed).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS learn_checkin_completed JSONB DEFAULT '{}'::jsonb;
