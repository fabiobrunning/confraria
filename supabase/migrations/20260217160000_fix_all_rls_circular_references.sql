/*
  ## Fix ALL RLS Circular Reference Bugs

  Problem: Multiple policies across 6 tables use inline
  `EXISTS (SELECT 1 FROM public.profiles WHERE ...)` which triggers
  profiles RLS evaluation, causing infinite recursion since the
  "Admins can view all profiles" policy on profiles itself also
  queries profiles.

  Solution: Replace ALL inline profiles lookups with `public.is_admin()`
  which is SECURITY DEFINER (bypasses RLS, no recursion).

  Affected tables:
  1. profiles - "Admins can view all profiles" (direct circular)
  2. draws - "Admins can manage draws"
  3. business_transactions - 4 admin policies
  4. activity_logs - "Admins can read activity logs"
  5. member_companies - "Admins can manage all company associations"
  6. pre_registration_attempts - 3 admin policies
*/

-- ============================================================
-- 1. PROFILES — Fix the root cause
-- ============================================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.is_admin()
  );

-- ============================================================
-- 2. DRAWS — Replace inline profiles check
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage draws" ON public.draws;
CREATE POLICY "Admins can manage draws"
  ON public.draws
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 3. BUSINESS_TRANSACTIONS — Replace all 4 admin policies
--    (wrapped in DO block: table may not exist in all environments)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'business_transactions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all business transactions" ON public.business_transactions';
    EXECUTE 'CREATE POLICY "Admins can view all business transactions"
      ON public.business_transactions FOR SELECT TO authenticated
      USING (public.is_admin())';

    EXECUTE 'DROP POLICY IF EXISTS "Admins can insert business transactions" ON public.business_transactions';
    EXECUTE 'CREATE POLICY "Admins can insert business transactions"
      ON public.business_transactions FOR INSERT TO authenticated
      WITH CHECK (public.is_admin())';

    EXECUTE 'DROP POLICY IF EXISTS "Admins can update business transactions" ON public.business_transactions';
    EXECUTE 'CREATE POLICY "Admins can update business transactions"
      ON public.business_transactions FOR UPDATE TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin())';

    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete business transactions" ON public.business_transactions';
    EXECUTE 'CREATE POLICY "Admins can delete business transactions"
      ON public.business_transactions FOR DELETE TO authenticated
      USING (public.is_admin())';
  END IF;
END;
$$;

-- ============================================================
-- 4. ACTIVITY_LOGS — Replace admin read policy
-- ============================================================

DROP POLICY IF EXISTS "Admins can read activity logs" ON public.activity_logs;
CREATE POLICY "Admins can read activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 5. MEMBER_COMPANIES — Replace admin manage policy
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage all company associations" ON public.member_companies;
CREATE POLICY "Admins can manage all company associations"
  ON public.member_companies
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 6. PRE_REGISTRATION_ATTEMPTS — Replace 3 admin policies
-- ============================================================

DROP POLICY IF EXISTS "Admins can view all pre_registration_attempts" ON public.pre_registration_attempts;
CREATE POLICY "Admins can view all pre_registration_attempts"
  ON public.pre_registration_attempts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create pre_registration_attempts" ON public.pre_registration_attempts;
CREATE POLICY "Admins can create pre_registration_attempts"
  ON public.pre_registration_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND created_by_admin_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can update pre_registration_attempts" ON public.pre_registration_attempts;
CREATE POLICY "Admins can update pre_registration_attempts"
  ON public.pre_registration_attempts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
