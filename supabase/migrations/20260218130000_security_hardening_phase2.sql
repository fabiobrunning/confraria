/*
  ## Security Hardening Phase 2 — 2026-02-18

  Remaining items from full security audit (*security-audit completa).

  ### Fix 5 (MEDIUM): event_confirmations — inline phone query fragility
  - Member RLS policies use inline SELECT from profiles to match phone
  - Created get_user_phone() SECURITY DEFINER helper for consistency
  - Replaced inline queries in 3 policies

  ### Fix 6 (MEDIUM): handle_new_user() — hardcoded admin phone
  - Admin master phone was hardcoded as '48991836483@confraria.local'
  - Changed to check against a configurable admin phone stored in app_settings
  - Falls back to hardcoded value if setting doesn't exist (backward compatible)

  ### Fix 7 (LOW): Cleanup legacy tables
  - members: replaced by profiles + member_companies
  - leads: replaced by prospects
  - closed_deals: replaced by business_transactions
  - Renamed with _deprecated suffix instead of DROP (safer)

  ### Fix 8 (LOW): Remove legacy is_admin(UUID) overload
  - Original is_admin(user_id UUID) accepts any UUID (security risk)
  - Current is_admin() (no params) uses auth.uid() internally (correct)
  - Drop the unsafe overload

  Rollback: See bottom of file.
*/

-- ============================================================
-- FIX 5 (MEDIUM): get_user_phone() helper for event_confirmations
-- ============================================================

-- Create helper function to get authenticated user's phone
CREATE OR REPLACE FUNCTION public.get_user_phone()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone FROM public.profiles
  WHERE id = auth.uid() AND deleted_at IS NULL;
$$;

COMMENT ON FUNCTION public.get_user_phone() IS 'Returns authenticated user phone from profiles (SECURITY DEFINER, no RLS recursion)';

-- Replace inline queries in event_confirmations policies
DROP POLICY IF EXISTS "Members can view own confirmations" ON public.event_confirmations;
CREATE POLICY "Members can view own confirmations"
  ON public.event_confirmations
  FOR SELECT
  TO authenticated
  USING (user_phone = public.get_user_phone());

DROP POLICY IF EXISTS "Members can insert own confirmations" ON public.event_confirmations;
CREATE POLICY "Members can insert own confirmations"
  ON public.event_confirmations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_phone = public.get_user_phone());

DROP POLICY IF EXISTS "Members can update own confirmations" ON public.event_confirmations;
CREATE POLICY "Members can update own confirmations"
  ON public.event_confirmations
  FOR UPDATE
  TO authenticated
  USING (user_phone = public.get_user_phone())
  WITH CHECK (user_phone = public.get_user_phone());

-- ============================================================
-- FIX 6 (MEDIUM): handle_new_user() — remove hardcoded admin phone
-- ============================================================

-- Create app_settings table for configurable values
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write settings
DROP POLICY IF EXISTS "Admins can manage app_settings" ON public.app_settings;
CREATE POLICY "Admins can manage app_settings"
  ON public.app_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed the admin phone setting (using the existing hardcoded value)
INSERT INTO public.app_settings (key, value, description)
VALUES ('admin_master_phone', '48991836483', 'Phone number for automatic admin role assignment on signup')
ON CONFLICT (key) DO NOTHING;

-- Update handle_new_user() to use configurable admin phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_phone text;
  admin_phone text;
BEGIN
  user_phone := split_part(NEW.email, '@', 1);

  -- Get configurable admin phone, fall back to hardcoded value
  SELECT value INTO admin_phone
  FROM public.app_settings
  WHERE key = 'admin_master_phone';

  IF admin_phone IS NULL THEN
    admin_phone := '48991836483';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    IF user_phone = admin_phone THEN
      INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
      VALUES (NEW.id, 'Administrador Master', user_phone, 'admin', now(), now());
    ELSE
      INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
      VALUES (NEW.id, '', user_phone, 'member', now(), now());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- FIX 7 (LOW): Rename legacy tables (safer than DROP)
-- ============================================================

-- members → _deprecated_members
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'members') THEN
    ALTER TABLE public.members RENAME TO _deprecated_members;
    RAISE NOTICE 'Renamed members → _deprecated_members';
  END IF;
END;
$$;

-- leads → _deprecated_leads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
    ALTER TABLE public.leads RENAME TO _deprecated_leads;
    RAISE NOTICE 'Renamed leads → _deprecated_leads';
  END IF;
END;
$$;

-- closed_deals → _deprecated_closed_deals
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'closed_deals') THEN
    ALTER TABLE public.closed_deals RENAME TO _deprecated_closed_deals;
    RAISE NOTICE 'Renamed closed_deals → _deprecated_closed_deals';
  END IF;
END;
$$;

-- ============================================================
-- FIX 8 (LOW): Remove legacy is_admin(UUID) overload
-- ============================================================

-- The old is_admin(user_id UUID) accepts ANY UUID as parameter,
-- allowing callers to check admin status for any user (info leak).
-- The current is_admin() (no params) uses auth.uid() internally.

-- Step 1: Migrate all 12 dependent policies from is_admin(auth.uid()) to is_admin()
-- Note: These policies call is_admin(auth.uid()) which resolves to the UUID overload.
-- We rewrite them to use is_admin() (no params) which uses auth.uid() internally.

-- companies policies (3)
DROP POLICY IF EXISTS "Companies insert policy" ON public.companies;
CREATE POLICY "Companies insert policy"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Companies update policy" ON public.companies;
CREATE POLICY "Companies update policy"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Companies delete policy" ON public.companies;
CREATE POLICY "Companies delete policy"
  ON public.companies FOR DELETE TO authenticated
  USING (public.is_admin());

-- member_companies policies (3)
DROP POLICY IF EXISTS "Member companies insert policy" ON public.member_companies;
CREATE POLICY "Member companies insert policy"
  ON public.member_companies FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Member companies update policy" ON public.member_companies;
CREATE POLICY "Member companies update policy"
  ON public.member_companies FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Member companies delete policy" ON public.member_companies;
CREATE POLICY "Member companies delete policy"
  ON public.member_companies FOR DELETE TO authenticated
  USING (public.is_admin());

-- consortium_groups policies (3) — table may have been deprecated/renamed
DROP POLICY IF EXISTS "Consortium groups insert policy" ON public.consortium_groups;
CREATE POLICY "Consortium groups insert policy"
  ON public.consortium_groups FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Consortium groups update policy" ON public.consortium_groups;
CREATE POLICY "Consortium groups update policy"
  ON public.consortium_groups FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Consortium groups delete policy" ON public.consortium_groups;
CREATE POLICY "Consortium groups delete policy"
  ON public.consortium_groups FOR DELETE TO authenticated
  USING (public.is_admin());

-- quotas policies (3)
DROP POLICY IF EXISTS "Quotas insert policy" ON public.quotas;
CREATE POLICY "Quotas insert policy"
  ON public.quotas FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Quotas update policy" ON public.quotas;
CREATE POLICY "Quotas update policy"
  ON public.quotas FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Quotas delete policy" ON public.quotas;
CREATE POLICY "Quotas delete policy"
  ON public.quotas FOR DELETE TO authenticated
  USING (public.is_admin());

-- Step 2: Now safe to drop the UUID overload
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- ============================================================
-- ROLLBACK (run manually if needed)
-- ============================================================
/*
-- Rollback Fix 5
DROP FUNCTION IF EXISTS public.get_user_phone();
DROP POLICY IF EXISTS "Members can view own confirmations" ON public.event_confirmations;
DROP POLICY IF EXISTS "Members can insert own confirmations" ON public.event_confirmations;
DROP POLICY IF EXISTS "Members can update own confirmations" ON public.event_confirmations;
CREATE POLICY "Members can view own confirmations" ON public.event_confirmations
  FOR SELECT TO authenticated USING (user_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Members can insert own confirmations" ON public.event_confirmations
  FOR INSERT TO authenticated WITH CHECK (user_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Members can update own confirmations" ON public.event_confirmations
  FOR UPDATE TO authenticated USING (user_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (user_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid()));

-- Rollback Fix 6
DROP TABLE IF EXISTS public.app_settings;
-- Restore original handle_new_user() from migration 20251002170244

-- Rollback Fix 7
ALTER TABLE IF EXISTS public._deprecated_members RENAME TO members;
ALTER TABLE IF EXISTS public._deprecated_leads RENAME TO leads;
ALTER TABLE IF EXISTS public._deprecated_closed_deals RENAME TO closed_deals;

-- Rollback Fix 8
-- Step 1: Restore the UUID overload function
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin'); $$;
-- Step 2: Restore original policies that used is_admin(auth.uid())
-- (policies were recreated with is_admin() — restore with is_admin(auth.uid()) if needed)
*/
