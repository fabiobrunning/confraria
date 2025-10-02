/*
  # Create Quotas Table
  
  ## Purpose
  Creates the quotas table to manage individual quotas within consortium groups,
  tracking ownership and status of each quota.
  
  ## New Tables
  - `quotas`
    - `id` (uuid, primary key) - Unique identifier
    - `group_id` (uuid, foreign key) - References groups table
    - `quota_number` (integer) - Quota number within the group (1, 2, 3, etc.)
    - `member_id` (uuid, foreign key, nullable) - References profiles table (owner)
    - `status` (text) - Status: 'active' or 'contemplated'
    - `created_at` (timestamptz) - Timestamp of creation
    - `updated_at` (timestamptz) - Timestamp of last update
  
  ## Security
  - Enable RLS on quotas table
  - Add policy for authenticated users to view quotas
  - Add policy for admins to manage quotas
  
  ## Constraints
  - Unique constraint on (group_id, quota_number) to prevent duplicate quota numbers
  - Check constraint to ensure status is either 'active' or 'contemplated'
  - Cascade delete when group is deleted
  - Set null when member is deleted
*/

-- Create quotas table
CREATE TABLE IF NOT EXISTS public.quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  quota_number INTEGER NOT NULL,
  member_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'contemplated')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(group_id, quota_number)
);

-- Enable RLS
ALTER TABLE public.quotas ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view quotas
CREATE POLICY "Authenticated users can view quotas"
  ON public.quotas FOR SELECT
  TO authenticated
  USING (true);

-- Policy for users to view their own quotas
CREATE POLICY "Users can view own quotas"
  ON public.quotas FOR SELECT
  TO authenticated
  USING (auth.uid() = member_id);

-- Policy for admins to manage all quotas
CREATE POLICY "Admins can manage all quotas"
  ON public.quotas FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role')::text = 'admin')
  WITH CHECK ((auth.jwt()->>'role')::text = 'admin');

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_quotas_group_id ON public.quotas(group_id);
CREATE INDEX IF NOT EXISTS idx_quotas_member_id ON public.quotas(member_id);
CREATE INDEX IF NOT EXISTS idx_quotas_status ON public.quotas(status);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_quotas_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_quotas_updated_at ON public.quotas;
CREATE TRIGGER update_quotas_updated_at
  BEFORE UPDATE ON public.quotas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quotas_updated_at();