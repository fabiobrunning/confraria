/*
  # Create Member Companies Junction Table
  
  ## Purpose
  Creates a many-to-many relationship table between members (profiles) and companies,
  allowing members to be associated with multiple companies.
  
  ## New Tables
  - `member_companies`
    - `id` (uuid, primary key) - Unique identifier
    - `member_id` (uuid, foreign key) - References profiles table
    - `company_id` (uuid, foreign key) - References companies table
    - `created_at` (timestamptz) - Timestamp of creation
    - `updated_at` (timestamptz) - Timestamp of last update
  
  ## Security
  - Enable RLS on member_companies table
  - Add policy for users to view their own company associations
  - Add policy for admins to view all associations
  - Add policy for users to manage their own company associations
  - Add policy for admins to manage all associations
  
  ## Constraints
  - Unique constraint on (member_id, company_id) to prevent duplicates
  - Cascade delete when member or company is deleted
*/

-- Create member_companies table
CREATE TABLE IF NOT EXISTS public.member_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(member_id, company_id)
);

-- Enable RLS
ALTER TABLE public.member_companies ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own company associations
CREATE POLICY "Users can view own company associations"
  ON public.member_companies FOR SELECT
  TO authenticated
  USING (auth.uid() = member_id);

-- Policy for admins to view all company associations
CREATE POLICY "Admins can view all company associations"
  ON public.member_companies FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'role')::text = 'admin');

-- Policy for users to manage their own company associations
CREATE POLICY "Users can manage own company associations"
  ON public.member_companies FOR ALL
  TO authenticated
  USING (auth.uid() = member_id)
  WITH CHECK (auth.uid() = member_id);

-- Policy for admins to manage all company associations
CREATE POLICY "Admins can manage all company associations"
  ON public.member_companies FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role')::text = 'admin')
  WITH CHECK ((auth.jwt()->>'role')::text = 'admin');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_member_companies_member_id ON public.member_companies(member_id);
CREATE INDEX IF NOT EXISTS idx_member_companies_company_id ON public.member_companies(company_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_member_companies_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_member_companies_updated_at ON public.member_companies;
CREATE TRIGGER update_member_companies_updated_at
  BEFORE UPDATE ON public.member_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_member_companies_updated_at();