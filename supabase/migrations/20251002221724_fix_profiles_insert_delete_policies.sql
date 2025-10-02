/*
  # Fix Profiles INSERT and DELETE Policies
  
  ## Problem
  Missing INSERT and DELETE policies for profiles table, causing pre-registration to fail
  
  ## Changes
  1. Add INSERT policy for admins to create new profiles (for pre-registration)
  2. Add DELETE policy for admins to remove profiles
  3. Ensure service role can bypass RLS for Edge Functions
  
  ## Security
  - Only admins can insert new profiles
  - Only admins can delete profiles
  - Service role (used by Edge Functions) bypasses RLS automatically
*/

-- Drop existing INSERT and DELETE policies if they exist
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Create INSERT policy for admins
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'role')::text = 'admin'
  );

-- Create DELETE policy for admins
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'role')::text = 'admin'
  );

-- Note: Service role automatically bypasses RLS, so Edge Functions using
-- supabaseAdmin (with SERVICE_ROLE_KEY) will work without additional policies
