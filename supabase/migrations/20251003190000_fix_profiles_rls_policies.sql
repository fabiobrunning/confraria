/*
  # Fix Profiles RLS Policies

  ## Changes
  - Remove conflicting and redundant RLS policies on profiles table
  - Keep only simple, non-recursive policies that allow:
    - All authenticated users can view all profiles (SELECT)
    - Users can update their own profile (UPDATE)
    - Users can insert their own profile on signup (INSERT)
    - Admins can insert any profile (INSERT)
    - Admins can delete profiles (DELETE)

  ## Security
  - No recursion in policies
  - Clear and simple permission model
  - Maintains data security while fixing 406 errors
*/

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Create new simplified policies
-- SELECT: All authenticated users can view all profiles
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE: Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT: Users can insert their own profile OR admins can insert any profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert any profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: Only admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
