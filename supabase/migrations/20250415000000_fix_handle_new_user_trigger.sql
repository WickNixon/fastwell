-- ============================================================
-- Fix handle_new_user trigger
--
-- Root cause of "database error saving new user":
-- SECURITY DEFINER functions run with a reset search_path,
-- so INSERT INTO profiles fails because the public schema
-- is not in the search path. Adding SET search_path = public
-- fixes this.
--
-- Also improved to:
-- - Use fully-qualified public.profiles table reference
-- - Read subscription_tier from user metadata set at signup
-- - Set trial_ends_at at profile creation (14 days for
--   subscribers, 3 months for members)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tier TEXT;
  v_trial_ends TIMESTAMPTZ;
BEGIN
  v_tier := COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'subscriber');

  v_trial_ends := CASE
    WHEN v_tier = 'member' THEN NOW() + INTERVAL '3 months'
    ELSE NOW() + INTERVAL '14 days'
  END;

  INSERT INTO public.profiles (id, subscription_tier, trial_ends_at, created_at, updated_at)
  VALUES (NEW.id, v_tier, v_trial_ends, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create the trigger (DROP + CREATE to ensure it's attached cleanly)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
