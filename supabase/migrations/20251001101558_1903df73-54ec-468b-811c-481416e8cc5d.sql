-- Drop the old insert policy that only allows admins
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create new policy that allows users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Also allow admins to insert any profile
CREATE POLICY "Admins can insert any profile"
ON public.profiles
FOR INSERT
WITH CHECK (is_admin(auth.uid()));