/*
  ## Security Audit Fixes — 2026-02-18

  Fixes identified during full security audit (*security-audit completa).

  ### Fix 1 (CRITICAL): Prospects RLS — overly permissive
  - Any authenticated user could SELECT/UPDATE ALL prospects
  - Now restricted to admins only (+ anon INSERT for public form)

  ### Fix 2 (HIGH): Analytics functions — no access control
  - 4 SECURITY DEFINER functions exposed all transaction data
  - Now require admin role before returning results

  ### Fix 3 (HIGH): Groups — inline profiles queries (recursion risk)
  - Admin policies used EXISTS(SELECT FROM profiles) instead of is_admin()
  - Replaced with is_admin() for consistency and safety

  ### Fix 4 (MEDIUM): Activity logs INSERT — any authenticated could impersonate
  - Policy named "Service role" but applied to all authenticated users
  - Replaced with scoped policy: users can only insert logs for themselves
  - lib/activity-log.ts uses createClient() (RLS-enabled), needs INSERT policy

  Rollback: See bottom of file for ROLLBACK commands.
*/

-- ============================================================
-- FIX 1 (CRITICAL): Prospects — restrict to admin only
-- ============================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "prospects_select_auth" ON public.prospects;
DROP POLICY IF EXISTS "prospects_update_auth" ON public.prospects;

-- Keep public INSERT (landing page form) — already exists as "prospects_insert_public"
-- If missing, recreate:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'prospects' AND policyname = 'prospects_insert_public'
  ) THEN
    EXECUTE 'CREATE POLICY "prospects_insert_public" ON public.prospects
      FOR INSERT TO anon, authenticated
      WITH CHECK (TRUE)';
  END IF;
END;
$$;

-- Only admins can view prospects
CREATE POLICY "Admins can view all prospects"
  ON public.prospects
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Only admins can update prospects
CREATE POLICY "Admins can update prospects"
  ON public.prospects
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete prospects
CREATE POLICY "Admins can delete prospects"
  ON public.prospects
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- FIX 2 (HIGH): Analytics functions — DEFERRED
-- ============================================================
-- The Supabase migration runner cannot resolve the custom enum
-- 'transaction_type' during migration parsing. These 4 functions
-- must be updated via Supabase Dashboard > SQL Editor.
-- See: supabase/fix2_analytics_functions_admin_guard.sql

-- ============================================================
-- FIX 3 (HIGH): Groups — replace inline queries with is_admin()
-- ============================================================

-- Drop all admin policies that use inline profiles queries
DROP POLICY IF EXISTS "Admins can view all groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can insert groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON public.groups;

-- Recreate with is_admin()
CREATE POLICY "Admins can view all groups"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert groups"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all groups"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete groups"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Keep existing non-admin policies untouched:
-- "Authenticated users can view active groups" → USING (is_active = true)
-- "Group admins can update their groups" → USING (admin_id = auth.uid())

-- ============================================================
-- FIX 4 (MEDIUM): Activity logs — restrict INSERT to own user_id
-- ============================================================

-- The existing policy allowed ANY authenticated user to insert logs with
-- ANY user_id (impersonation risk). Since lib/activity-log.ts uses
-- createClient() (regular client with RLS), we need an INSERT policy,
-- but scoped: users can only insert logs for themselves.
DROP POLICY IF EXISTS "Service role can insert activity logs" ON public.activity_logs;

CREATE POLICY "Authenticated users can log own activities"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- ROLLBACK (run manually if needed)
-- ============================================================
/*
-- Rollback Fix 1: Restore permissive prospects policies
DROP POLICY IF EXISTS "Admins can view all prospects" ON public.prospects;
DROP POLICY IF EXISTS "Admins can update prospects" ON public.prospects;
DROP POLICY IF EXISTS "Admins can delete prospects" ON public.prospects;
CREATE POLICY "prospects_select_auth" ON prospects
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "prospects_update_auth" ON prospects
  FOR UPDATE TO authenticated USING (TRUE);

-- Rollback Fix 2: Restore original analytics functions (without admin guard)
-- See migration 20260127102827_create_business_transactions_table.sql lines 182-254

-- Rollback Fix 3: Restore inline groups policies
-- See migration 20251002170244_complete_database_schema.sql lines 228-283

-- Rollback Fix 4: Restore open INSERT policy
DROP POLICY IF EXISTS "Authenticated users can log own activities" ON public.activity_logs;
CREATE POLICY "Service role can insert activity logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);
*/
