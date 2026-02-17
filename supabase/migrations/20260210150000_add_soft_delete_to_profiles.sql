-- Add soft delete column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Index for filtering out deleted profiles
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at)
  WHERE deleted_at IS NULL;

-- Update existing RLS policies to exclude soft-deleted profiles
-- Drop and recreate the select policy to filter deleted profiles

-- For members reading their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    AND deleted_at IS NULL
  );

-- For admins reading all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.deleted_at IS NULL
    )
  );
