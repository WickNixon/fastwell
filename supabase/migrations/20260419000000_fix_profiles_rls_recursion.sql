-- ============================================================
-- Fix: infinite recursion in profiles RLS policy
-- 20260419000000_fix_profiles_rls_recursion.sql
--
-- Root cause: profiles_select_own policy used an inline subquery
-- `EXISTS (SELECT 1 FROM profiles WHERE ...)` to check admin role.
-- Because this subquery runs against the profiles table, which has
-- RLS enabled, PostgreSQL re-evaluates the same policy — infinite loop.
-- The same inline pattern existed in invite_tokens, membership_whitelist,
-- and email_log admin policies (safe there only because auth.uid() = id
-- short-circuits first for authenticated users, but it is still fragile).
--
-- Fix: extract the admin check into a SECURITY DEFINER function.
-- SECURITY DEFINER runs as the function owner (postgres), bypassing RLS
-- for the inner SELECT, which breaks the recursion.
-- ============================================================

-- Safe admin-check helper (bypasses RLS for the inner profiles query)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- ----------------
-- profiles: replace the recursive SELECT policy
-- ----------------
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR is_admin_user()
  );

-- ----------------
-- invite_tokens: replace inline admin subquery
-- ----------------
DROP POLICY IF EXISTS "invite_tokens_admin_all" ON invite_tokens;
CREATE POLICY "invite_tokens_admin_all" ON invite_tokens
  FOR ALL USING (is_admin_user());

-- ----------------
-- membership_whitelist: replace inline admin subquery
-- ----------------
DROP POLICY IF EXISTS "membership_whitelist_admin_all" ON membership_whitelist;
CREATE POLICY "membership_whitelist_admin_all" ON membership_whitelist
  FOR ALL USING (is_admin_user());

-- ----------------
-- email_log: replace inline admin subquery
-- ----------------
DROP POLICY IF EXISTS "email_log_admin_select" ON email_log;
CREATE POLICY "email_log_admin_select" ON email_log
  FOR SELECT USING (is_admin_user());
