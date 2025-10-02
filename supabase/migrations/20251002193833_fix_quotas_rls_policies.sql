/*
  # Fix Quotas RLS Policies
  
  ## Summary
  Fixes the Row Level Security policies for the quotas table to properly check
  if a user is an admin by looking up their role in the profiles table instead
  of relying on JWT metadata.
  
  ## Changes
  1. Create helper function to check if user is admin
  2. Drop existing admin policies for quotas
  3. Recreate policies using the helper function
  
  ## Security
  - Ensures only actual admins from profiles table can manage quotas
  - Maintains read access for authenticated users
*/

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can manage all quotas" ON public.quotas;

-- Recreate admin policies with proper role checking
CREATE POLICY "Admins can insert quotas"
  ON public.quotas FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update quotas"
  ON public.quotas FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete quotas"
  ON public.quotas FOR DELETE
  TO authenticated
  USING (public.is_admin());
