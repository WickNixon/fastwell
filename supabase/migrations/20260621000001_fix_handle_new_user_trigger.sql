-- Update handle_new_user trigger to use canonical subscription_tier values.
-- Old values ('subscriber', 'member') are no longer valid after the
-- 20260621000000 backfill migration. Update default to 'free' and
-- trial branch to match on 'member_pro'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tier TEXT;
  v_trial_ends TIMESTAMPTZ;
BEGIN
  v_tier := COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'free');

  v_trial_ends := CASE
    WHEN v_tier = 'member_pro' THEN NOW() + INTERVAL '3 months'
    ELSE NOW() + INTERVAL '14 days'
  END;

  INSERT INTO public.profiles (id, subscription_tier, trial_ends_at, created_at, updated_at)
  VALUES (NEW.id, v_tier, v_trial_ends, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
