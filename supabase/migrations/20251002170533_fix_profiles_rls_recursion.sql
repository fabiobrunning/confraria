/*
  # Fix Profiles RLS Infinite Recursion
  
  ## Problem
  The admin policies on the profiles table were causing infinite recursion
  because they query the profiles table to check if the user is an admin,
  creating a circular dependency.
  
  ## Solution
  Use auth.jwt() to check the user's role from the JWT token metadata instead
  of querying the profiles table. This requires storing the role in the user's
  app_metadata.
  
  ## Changes
  1. Drop existing policies on profiles table
  2. Create new policies that use JWT metadata
  3. Add function to sync role to JWT metadata
  4. Add trigger to keep JWT metadata in sync
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new policies without recursion
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'role')::text = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->>'role')::text = 'admin'
  );

-- Function to sync role to auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_role_to_auth_metadata()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the auth.users raw_app_meta_data with the role
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger to sync role changes to auth metadata
DROP TRIGGER IF EXISTS sync_role_to_auth ON public.profiles;
CREATE TRIGGER sync_role_to_auth
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_auth_metadata();

-- Update existing profiles to sync their roles to JWT
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT id, role FROM public.profiles
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', profile_record.role)
    WHERE id = profile_record.id;
  END LOOP;
END $$;