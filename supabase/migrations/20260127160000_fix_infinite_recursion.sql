/*
  # Fix Infinite Recursion in RLS Policies

  ## Problem
  RLS policies on profiles and companies tables were causing infinite recursion:
  - companies policies check if user is admin by querying profiles
  - profiles policies (INSERT/DELETE) also check if user is admin by querying profiles
  - This creates an infinite loop: companies → profiles → profiles → profiles...

  ## Solution
  Create a secure helper function that checks admin role WITHOUT triggering RLS policies.
  Using SECURITY DEFINER allows the function to bypass RLS and directly access the data.

  ## Changes
  1. Create is_admin() helper function with SECURITY DEFINER
  2. Update all policies to use is_admin() instead of EXISTS subqueries
  3. This breaks the recursion chain
*/

-- Step 1: Create helper function to check if user is admin
-- SECURITY DEFINER means it runs with the privileges of the function creator (bypassing RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Step 2: Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Step 3: Recreate policies using the helper function (no recursion!)
-- INSERT: Admins can insert any profile
CREATE POLICY "Admins can insert any profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- DELETE: Only admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Step 4: Drop existing problematic policies on companies
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;

-- Step 5: Recreate companies policies using the helper function
-- UPDATE: Only admins can update companies
CREATE POLICY "companies_update_policy"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Only admins can delete companies
CREATE POLICY "companies_delete_policy"
  ON public.companies
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Step 6: Update ALL other tables that check for admin role
-- This ensures consistency and prevents future recursion issues

-- Groups table
DROP POLICY IF EXISTS "groups_insert_policy" ON public.groups;
DROP POLICY IF EXISTS "groups_update_policy" ON public.groups;
DROP POLICY IF EXISTS "groups_delete_policy" ON public.groups;

CREATE POLICY "groups_insert_policy"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "groups_update_policy"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "groups_delete_policy"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Quotas table (admin policies)
DROP POLICY IF EXISTS "quotas_insert_policy" ON public.quotas;
DROP POLICY IF EXISTS "quotas_update_policy" ON public.quotas;
DROP POLICY IF EXISTS "quotas_delete_policy" ON public.quotas;

CREATE POLICY "quotas_insert_policy"
  ON public.quotas
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "quotas_update_policy"
  ON public.quotas
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "quotas_delete_policy"
  ON public.quotas
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Member companies table
DROP POLICY IF EXISTS "member_companies_insert_policy" ON public.member_companies;
DROP POLICY IF EXISTS "member_companies_update_policy" ON public.member_companies;
DROP POLICY IF EXISTS "member_companies_delete_policy" ON public.member_companies;

CREATE POLICY "member_companies_insert_policy"
  ON public.member_companies
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "member_companies_update_policy"
  ON public.member_companies
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "member_companies_delete_policy"
  ON public.member_companies
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Business transactions table
DROP POLICY IF EXISTS "business_transactions_insert_policy" ON public.business_transactions;
DROP POLICY IF EXISTS "business_transactions_update_policy" ON public.business_transactions;
DROP POLICY IF EXISTS "business_transactions_delete_policy" ON public.business_transactions;

CREATE POLICY "business_transactions_insert_policy"
  ON public.business_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "business_transactions_update_policy"
  ON public.business_transactions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "business_transactions_delete_policy"
  ON public.business_transactions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Draws table
DROP POLICY IF EXISTS "draws_insert_policy" ON public.draws;
DROP POLICY IF EXISTS "draws_delete_policy" ON public.draws;

CREATE POLICY "draws_insert_policy"
  ON public.draws
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "draws_delete_policy"
  ON public.draws
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Add comment explaining the function
COMMENT ON FUNCTION public.is_admin() IS
'Helper function to check if the current user has admin role.
Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.
Used by all RLS policies that need to verify admin permissions.';
