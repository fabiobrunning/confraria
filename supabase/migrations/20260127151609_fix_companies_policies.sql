/*
  # Fix Companies RLS Policies

  This migration fixes the companies table RLS policies that were referencing
  a non-existent 'created_by' column.

  ## Changes
  - Drop broken policies that reference created_by
  - Recreate policies without created_by dependency
  - Allow authenticated users to view all companies
  - Allow admins to manage all companies
  - Allow users to insert companies (no ownership tracking)
*/

-- Drop existing broken policies (if any)
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;

-- SELECT: All authenticated users can view all companies
CREATE POLICY "companies_select_policy"
ON public.companies
FOR SELECT
TO authenticated
USING (true);

-- INSERT: All authenticated users can create companies
CREATE POLICY "companies_insert_policy"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Only admins can update companies
CREATE POLICY "companies_update_policy"
ON public.companies
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

-- DELETE: Only admins can delete companies
CREATE POLICY "companies_delete_policy"
ON public.companies
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
    AND p.role = 'admin'
  )
);
