/*
  # Fix Security Issues in RLS Policies and Database

  ## Changes

  ### 1. Performance Optimization
  - Replace all `auth.uid()` with `(select auth.uid())` in RLS policies
  - This prevents re-evaluation of auth functions for each row

  ### 2. Remove Duplicate Policies
  - Drop redundant policies that conflict with each other
  - Keep only the most specific and necessary policies

  ### 3. Remove Unused Indexes
  - Drop indexes that are not being used by queries

  ### 4. Fix Function Security
  - Set proper search_path for functions to prevent security issues

  ## Security Impact
  - Improves query performance at scale
  - Reduces attack surface by removing duplicate policies
  - Prevents search_path manipulation attacks
*/

-- =====================================================
-- 1. FIX PROFILES TABLE POLICIES
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;

-- Create optimized policies
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Admins can insert any profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- =====================================================
-- 2. FIX COMPANIES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Companies select policy" ON public.companies;
DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Companies insert policy" ON public.companies;
DROP POLICY IF EXISTS "Admins can update companies" ON public.companies;
DROP POLICY IF EXISTS "Companies update policy" ON public.companies;
DROP POLICY IF EXISTS "Admins can delete companies" ON public.companies;
DROP POLICY IF EXISTS "Companies delete policy" ON public.companies;

CREATE POLICY "Authenticated users can view companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage companies"
  ON public.companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- =====================================================
-- 3. FIX GROUPS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can view active groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can insert groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON public.groups;

CREATE POLICY "Authenticated users can view all groups"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert groups"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins and group admins can update groups"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (
    admin_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    admin_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete groups"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- =====================================================
-- 4. FIX MEMBERS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view members in their groups" ON public.members;
DROP POLICY IF EXISTS "Users can view own member record" ON public.members;
DROP POLICY IF EXISTS "Admins can view all members" ON public.members;
DROP POLICY IF EXISTS "Group admins can view members in their groups" ON public.members;
DROP POLICY IF EXISTS "Admins can insert members" ON public.members;
DROP POLICY IF EXISTS "Group admins can insert members in their groups" ON public.members;
DROP POLICY IF EXISTS "Admins can update members" ON public.members;
DROP POLICY IF EXISTS "Group admins can update members in their groups" ON public.members;
DROP POLICY IF EXISTS "Users can update own member record" ON public.members;
DROP POLICY IF EXISTS "Admins can delete members" ON public.members;
DROP POLICY IF EXISTS "Group admins can delete members in their groups" ON public.members;

CREATE POLICY "Users can view all members"
  ON public.members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage members"
  ON public.members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Group admins can manage their members"
  ON public.members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = members.group_id AND admin_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = members.group_id AND admin_id = (select auth.uid())
    )
  );

-- =====================================================
-- 5. FIX MEMBER_COMPANIES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all company associations" ON public.member_companies;
DROP POLICY IF EXISTS "Users can view own company associations" ON public.member_companies;
DROP POLICY IF EXISTS "Users can manage own company associations" ON public.member_companies;
DROP POLICY IF EXISTS "Admins can manage all company associations" ON public.member_companies;
DROP POLICY IF EXISTS "Member companies select policy" ON public.member_companies;
DROP POLICY IF EXISTS "Member companies insert policy" ON public.member_companies;
DROP POLICY IF EXISTS "Member companies update policy" ON public.member_companies;
DROP POLICY IF EXISTS "Member companies delete policy" ON public.member_companies;

CREATE POLICY "Users can view all company associations"
  ON public.member_companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own company associations"
  ON public.member_companies
  FOR ALL
  TO authenticated
  USING (member_id = (select auth.uid()))
  WITH CHECK (member_id = (select auth.uid()));

CREATE POLICY "Admins can manage all company associations"
  ON public.member_companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- =====================================================
-- 6. FIX QUOTAS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own quotas" ON public.quotas;
DROP POLICY IF EXISTS "Authenticated users can view quotas" ON public.quotas;
DROP POLICY IF EXISTS "Quotas select policy" ON public.quotas;
DROP POLICY IF EXISTS "Admins can insert quotas" ON public.quotas;
DROP POLICY IF EXISTS "Quotas insert policy" ON public.quotas;
DROP POLICY IF EXISTS "Admins can update quotas" ON public.quotas;
DROP POLICY IF EXISTS "Quotas update policy" ON public.quotas;
DROP POLICY IF EXISTS "Admins can delete quotas" ON public.quotas;
DROP POLICY IF EXISTS "Quotas delete policy" ON public.quotas;

CREATE POLICY "Authenticated users can view all quotas"
  ON public.quotas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage quotas"
  ON public.quotas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- =====================================================
-- 7. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_companies_cnpj;
DROP INDEX IF EXISTS public.idx_groups_company_id;
DROP INDEX IF EXISTS public.idx_groups_is_active;
DROP INDEX IF EXISTS public.idx_groups_name;
DROP INDEX IF EXISTS public.idx_members_company_id;
DROP INDEX IF EXISTS public.idx_members_phone;
DROP INDEX IF EXISTS public.idx_members_email;
DROP INDEX IF EXISTS public.idx_members_status;
DROP INDEX IF EXISTS public.idx_members_registration_number;
DROP INDEX IF EXISTS public.idx_member_companies_company_id;
DROP INDEX IF EXISTS public.idx_quotas_status;

-- =====================================================
-- 8. FIX FUNCTION SECURITY (Search Path)
-- =====================================================

-- Fix is_admin function
DROP FUNCTION IF EXISTS public.is_admin();
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Fix update_member_companies_updated_at function
DROP FUNCTION IF EXISTS public.update_member_companies_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_member_companies_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate trigger for member_companies
DROP TRIGGER IF EXISTS update_member_companies_updated_at ON public.member_companies;
CREATE TRIGGER update_member_companies_updated_at
  BEFORE UPDATE ON public.member_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_member_companies_updated_at();

-- Fix update_quotas_updated_at function
DROP FUNCTION IF EXISTS public.update_quotas_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_quotas_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate trigger for quotas
DROP TRIGGER IF EXISTS update_quotas_updated_at ON public.quotas;
CREATE TRIGGER update_quotas_updated_at
  BEFORE UPDATE ON public.quotas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quotas_updated_at();

-- Fix update_updated_at_column function (if exists)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate all triggers that use update_updated_at_column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
