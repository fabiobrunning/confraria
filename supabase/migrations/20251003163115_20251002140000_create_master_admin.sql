/*
  # Create Master Admin User via Function

  Creates the initial master administrator user for the system.

  ## User Details
    - Phone: 48991836483
    - Email: 48991836483@confraria.local
    - Password: confraria
    - Role: admin
    - Name: Administrador Master

  ## Important Note
    This migration creates a helper function that can be called to create the master admin.
    The actual user creation should be done via Supabase Dashboard or using the Admin API.

  ## Manual Steps Required
    1. Go to Supabase Dashboard > Authentication > Users
    2. Click "Add user" > "Create new user"
    3. Set:
       - Email: 48991836483@confraria.local
       - Password: confraria
       - Auto Confirm User: YES
    4. After user is created, the trigger will automatically create the profile

  ## Alternative: Use SQL (requires proper setup)
    If you have access to service role key, you can use the Admin API to create users.
*/

-- Create a function to setup master admin profile
-- This will be called by a trigger when the auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_phone text;
BEGIN
  -- Extract phone from email (format: phone@confraria.local)
  user_phone := split_part(NEW.email, '@', 1);

  -- Only create profile if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Check if this is the master admin email
    IF NEW.email = '48991836483@confraria.local' THEN
      INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
      VALUES (
        NEW.id,
        'Administrador Master',
        user_phone,
        'admin',
        now(),
        now()
      );
    ELSE
      -- For other users, create with member role
      INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
      VALUES (
        NEW.id,
        '',
        user_phone,
        'member',
        now(),
        now()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();