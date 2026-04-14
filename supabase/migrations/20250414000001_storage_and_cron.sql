-- ============================================================
-- Migration: Storage bucket + pg_cron jobs
-- Fastwell · Wicked Wellbeing
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- Storage: exports bucket for GP-ready PDF exports
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false,  -- private bucket; access via signed URLs only
  10485760,  -- 10 MB max per file
  ARRAY['text/html', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can only access their own export files
CREATE POLICY "exports_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "exports_insert_service"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exports');

-- ============================================================
-- pg_cron: Daily scheduled jobs (times in UTC)
--
-- NZST = UTC+12 | NZDT = UTC+13
-- 6am NZST  = 18:00 UTC (standard) / 17:00 UTC (daylight)
-- 9am NZST  = 21:00 UTC (standard) / 20:00 UTC (daylight)
--
-- Using standard-time UTC offsets year-round.
-- Adjust manually when daylight saving changes if precision matters.
-- ============================================================

-- Store the service role key and project URL as vault secrets before enabling cron.
-- In Supabase Dashboard → Settings → Vault, create:
--   Name: "service_role_key"   Value: <your service role JWT>
--   Name: "supabase_url"       Value: https://yfmwbkjvzjpqzgogesag.supabase.co
--
-- The cron jobs below reference these vault secrets.

-- AI Insights batch — daily 6am NZST (18:00 UTC)
SELECT cron.schedule(
  'fastwell-ai-insights-daily',
  '0 18 * * *',
  $$
  SELECT
    net.http_post(
      url        := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/generate-insights-batch',
      headers    := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
      ),
      body       := '{"scheduled": true}'::jsonb,
      timeout_milliseconds := 25000
    ) AS request_id;
  $$
);

-- Member trial reminder — daily 9am NZST (21:00 UTC)
SELECT cron.schedule(
  'fastwell-member-trial-reminder',
  '0 21 * * *',
  $$
  SELECT
    net.http_post(
      url        := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/send-member-trial-reminder',
      headers    := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
      ),
      body       := '{"scheduled": true}'::jsonb,
      timeout_milliseconds := 25000
    ) AS request_id;
  $$
);
