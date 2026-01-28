/*
  # Fix Security and Performance Issues

  This migration addresses critical security and performance issues identified by Supabase advisors:

  ## 1. Performance Improvements
    - Add missing indexes on foreign keys (member_companies.company_id, quotas.member_id)
    - Optimize RLS policies by using `(select auth.uid())` instead of `auth.uid()`
    - Fix function search path mutability

  ## 2. Security Improvements
    - Remove anonymous (anon) role access - require authentication
    - Consolidate multiple permissive policies into single restrictive policies
    - Improve policy structure for better security

  ## Changes Made
    - Added indexes: member_companies_company_id_idx, quotas_member_id_idx
    - Recreated all RLS policies with optimized auth function calls
    - Removed anon role access (users must be authenticated)
    - Fixed update_updated_at_column function search path
*/

-- =====================================================
-- STEP 1: Add Missing Indexes for Foreign Keys
-- =====================================================

-- Index for member_companies.company_id foreign key
CREATE INDEX IF NOT EXISTS member_companies_company_id_idx
ON public.member_companies(company_id);

-- Index for quotas.member_id foreign key
CREATE INDEX IF NOT EXISTS quotas_member_id_idx
ON public.quotas(member_id);

-- =====================================================
-- STEP 2: Fix Function Search Path
-- =====================================================

-- Recreate update_updated_at_column with immutable search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 3: Drop All Existing RLS Policies
-- =====================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Companies policies
DROP POLICY IF EXISTS "Users can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Users can manage their own companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can manage all companies" ON public.companies;

-- Member companies policies
DROP POLICY IF EXISTS "Users can view all member_companies" ON public.member_companies;
DROP POLICY IF EXISTS "Users can manage their own links" ON public.member_companies;
DROP POLICY IF EXISTS "Admins can manage all member_companies" ON public.member_companies;

-- Groups policies
DROP POLICY IF EXISTS "Users can view all groups" ON public.consortium_groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.consortium_groups;

-- Quotas policies
DROP POLICY IF EXISTS "Users can view all quotas" ON public.quotas;
DROP POLICY IF EXISTS "Members can view their own quotas" ON public.quotas;
DROP POLICY IF EXISTS "Admins can manage all quotas" ON public.quotas;

-- =====================================================
-- STEP 4: Create Optimized RLS Policies for PROFILES
-- =====================================================

-- SELECT: Users can read their own profile, admins can read all
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);

-- INSERT: Users can create their own profile, admins can create any
CREATE POLICY "profiles_insert_policy"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);

-- UPDATE: Users can update their own profile, admins can update any
CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
)
WITH CHECK (
  id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);

-- DELETE: Only admins can delete profiles
CREATE POLICY "profiles_delete_policy"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);

-- =====================================================
-- STEP 5: Create Optimized RLS Policies for COMPANIES
-- =====================================================

-- SELECT: All authenticated users can view companies
CREATE POLICY "companies_select_policy"
ON public.companies
FOR SELECT
TO authenticated
USING (true);

-- COMMENTED OUT: These policies reference non-existent created_by column
-- Fixed in migration 20260127151609_fix_companies_policies.sql

-- -- INSERT: Users can create their own companies, admins can create any
-- CREATE POLICY "companies_insert_policy"
-- ON public.companies
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   created_by = (select auth.uid())
--   OR
--   EXISTS (
--     SELECT 1 FROM public.profiles p
--     WHERE p.id = (select auth.uid())
--     AND p.role = 'admin'
--   )
-- );

-- -- UPDATE: Users can update their own companies, admins can update any
-- CREATE POLICY "companies_update_policy"
-- ON public.companies
-- FOR UPDATE
-- TO authenticated
-- USING (
--   created_by = (select auth.uid())
--   OR
--   EXISTS (
--     SELECT 1 FROM public.profiles p
--     WHERE p.id = (select auth.uid())
--     AND p.role = 'admin'
--   )
-- )
-- WITH CHECK (
--   created_by = (select auth.uid())
--   OR
--   EXISTS (
--     SELECT 1 FROM public.profiles p
--     WHERE p.id = (select auth.uid())
--     AND p.role = 'admin'
--   )
-- );

-- -- DELETE: Users can delete their own companies, admins can delete any
-- CREATE POLICY "companies_delete_policy"
-- ON public.companies
-- FOR DELETE
-- TO authenticated
-- USING (
--   created_by = (select auth.uid())
--   OR
--   EXISTS (
--     SELECT 1 FROM public.profiles p
--     WHERE p.id = (select auth.uid())
--     AND p.role = 'admin'
--   )
-- );

-- =====================================================
-- STEP 6: Create Optimized RLS Policies for MEMBER_COMPANIES
-- =====================================================

-- SELECT: All authenticated users can view member-company links
CREATE POLICY "member_companies_select_policy"
ON public.member_companies
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Users can create their own links, admins can create any
CREATE POLICY "member_companies_insert_policy"
ON public.member_companies
FOR INSERT
TO authenticated
WITH CHECK (
  member_id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);

-- UPDATE: Users can update their own links, admins can update any
CREATE POLICY "member_companies_update_policy"
ON public.member_companies
FOR UPDATE
TO authenticated
USING (
  member_id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
)
WITH CHECK (
  member_id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);

-- DELETE: Users can delete their own links, admins can delete any
CREATE POLICY "member_companies_delete_policy"
ON public.member_companies
FOR DELETE
TO authenticated
USING (
  member_id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);

-- =====================================================
-- STEP 7: Create Optimized RLS Policies for CONSORTIUM_GROUPS
-- =====================================================

-- SELECT: All authenticated users can view groups
CREATE POLICY "consortium_groups_select_policy"
ON public.consortium_groups
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Only admins can create groups
CREATE POLICY "consortium_groups_insert_policy"
ON public.consortium_groups
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);

-- UPDATE: Only admins can update groups
CREATE POLICY "consortium_groups_update_policy"
ON public.consortium_groups
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);

-- DELETE: Only admins can delete groups
CREATE POLICY "consortium_groups_delete_policy"
ON public.consortium_groups
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);

-- =====================================================
-- STEP 8: Create Optimized RLS Policies for QUOTAS
-- =====================================================

-- SELECT: All authenticated users can view quotas
CREATE POLICY "quotas_select_policy"
ON public.quotas
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Only admins can create quotas
CREATE POLICY "quotas_insert_policy"
ON public.quotas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);

-- UPDATE: Only admins can update quotas
CREATE POLICY "quotas_update_policy"
ON public.quotas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);

-- DELETE: Only admins can delete quotas
CREATE POLICY "quotas_delete_policy"
ON public.quotas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);
