/*
  # Fix Member Company Permissions
  
  ## Problem
  Members cannot save their profile changes because they cannot insert new companies.
  The current RLS policy only allows admins to manage companies.
  
  ## Solution
  Allow members to insert companies that will be associated with them through member_companies table.
  Members should be able to:
  - Insert new companies (that will be linked to them)
  - Update companies that are linked to them
  - Delete companies that are linked to them
  
  ## Changes
  - Drop the restrictive "Admins can manage companies" policy
  - Create separate policies for INSERT, UPDATE, DELETE that allow members to manage their own companies
*/

-- Drop the current restrictive policy
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;

-- Allow members to insert companies (they will be linked via member_companies table)
CREATE POLICY "Members can insert companies"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Any authenticated user can insert a company

-- Allow admins to manage all companies
CREATE POLICY "Admins can manage all companies"
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

-- Allow members to update companies that are linked to them
CREATE POLICY "Members can update their companies"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.member_companies mc
      WHERE mc.company_id = companies.id 
      AND mc.member_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.member_companies mc
      WHERE mc.company_id = companies.id 
      AND mc.member_id = (select auth.uid())
    )
  );

-- Allow members to delete companies that are linked to them
CREATE POLICY "Members can delete their companies"
  ON public.companies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.member_companies mc
      WHERE mc.company_id = companies.id 
      AND mc.member_id = (select auth.uid())
    )
  );