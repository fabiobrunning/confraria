/*
  # Fix Security Issues

  ## Changes Made

  ### 1. Add Missing Indexes for Foreign Keys
  - Add index on `member_companies.company_id` to improve join performance
  - Add index on `quotas.member_id` to improve join performance

  ### 2. Optimize RLS Policies with SELECT Wrapper
  - Wrap all `auth.uid()` and `auth.jwt()` calls with SELECT to prevent re-evaluation per row
  - Apply to all policies in: profiles, companies, member_companies, consortium_groups, quotas

  ### 3. Fix Function Search Path
  - Update `update_updated_at_column` function with immutable search_path

  ### 4. Consolidate Multiple Permissive Policies
  - Replace multiple permissive policies with single consolidated policies per action
  - Simplifies policy evaluation and improves performance

  ## Security Improvements
  - Better query performance at scale
  - Reduced policy complexity
  - Proper indexing for foreign key lookups
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_member_companies_company_id
  ON public.member_companies(company_id);

CREATE INDEX IF NOT EXISTS idx_quotas_member_id
  ON public.quotas(member_id);

-- Update function with immutable search_path
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

-- Drop all existing policies to recreate them optimized
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Users can manage their own companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can manage all companies" ON public.companies;

DROP POLICY IF EXISTS "Users can view all member_companies" ON public.member_companies;
DROP POLICY IF EXISTS "Users can manage their own links" ON public.member_companies;
DROP POLICY IF EXISTS "Admins can manage all member_companies" ON public.member_companies;

DROP POLICY IF EXISTS "Users can view all groups" ON public.consortium_groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.consortium_groups;

DROP POLICY IF EXISTS "Users can view all quotas" ON public.quotas;
DROP POLICY IF EXISTS "Admins can manage all quotas" ON public.quotas;

-- Create optimized RLS policies for profiles table
CREATE POLICY "Profiles select policy" ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = id
    OR public.is_admin((select auth.uid()))
  );

CREATE POLICY "Profiles delete policy" ON public.profiles
  FOR DELETE
  USING (public.is_admin((select auth.uid())));

-- Create optimized RLS policies for companies table
CREATE POLICY "Companies select policy" ON public.companies
  FOR SELECT
  USING (true);

CREATE POLICY "Companies insert policy" ON public.companies
  FOR INSERT
  WITH CHECK (
    public.is_admin((select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.member_companies
      WHERE company_id = companies.id
      AND member_id = (select auth.uid())
    )
  );

CREATE POLICY "Companies update policy" ON public.companies
  FOR UPDATE
  USING (
    public.is_admin((select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.member_companies
      WHERE company_id = companies.id
      AND member_id = (select auth.uid())
    )
  )
  WITH CHECK (
    public.is_admin((select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.member_companies
      WHERE company_id = companies.id
      AND member_id = (select auth.uid())
    )
  );

CREATE POLICY "Companies delete policy" ON public.companies
  FOR DELETE
  USING (
    public.is_admin((select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.member_companies
      WHERE company_id = companies.id
      AND member_id = (select auth.uid())
    )
  );

-- Create optimized RLS policies for member_companies table
CREATE POLICY "Member companies select policy" ON public.member_companies
  FOR SELECT
  USING (true);

CREATE POLICY "Member companies insert policy" ON public.member_companies
  FOR INSERT
  WITH CHECK (
    member_id = (select auth.uid())
    OR public.is_admin((select auth.uid()))
  );

CREATE POLICY "Member companies update policy" ON public.member_companies
  FOR UPDATE
  USING (
    member_id = (select auth.uid())
    OR public.is_admin((select auth.uid()))
  )
  WITH CHECK (
    member_id = (select auth.uid())
    OR public.is_admin((select auth.uid()))
  );

CREATE POLICY "Member companies delete policy" ON public.member_companies
  FOR DELETE
  USING (
    member_id = (select auth.uid())
    OR public.is_admin((select auth.uid()))
  );

-- Create optimized RLS policies for consortium_groups table
CREATE POLICY "Consortium groups select policy" ON public.consortium_groups
  FOR SELECT
  USING (true);

CREATE POLICY "Consortium groups insert policy" ON public.consortium_groups
  FOR INSERT
  WITH CHECK (public.is_admin((select auth.uid())));

CREATE POLICY "Consortium groups update policy" ON public.consortium_groups
  FOR UPDATE
  USING (public.is_admin((select auth.uid())))
  WITH CHECK (public.is_admin((select auth.uid())));

CREATE POLICY "Consortium groups delete policy" ON public.consortium_groups
  FOR DELETE
  USING (public.is_admin((select auth.uid())));

-- Create optimized RLS policies for quotas table
CREATE POLICY "Quotas select policy" ON public.quotas
  FOR SELECT
  USING (true);

CREATE POLICY "Quotas insert policy" ON public.quotas
  FOR INSERT
  WITH CHECK (public.is_admin((select auth.uid())));

CREATE POLICY "Quotas update policy" ON public.quotas
  FOR UPDATE
  USING (public.is_admin((select auth.uid())))
  WITH CHECK (public.is_admin((select auth.uid())));

CREATE POLICY "Quotas delete policy" ON public.quotas
  FOR DELETE
  USING (public.is_admin((select auth.uid())));
