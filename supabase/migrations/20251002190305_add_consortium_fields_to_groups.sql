/*
  # Add Consortium Fields to Groups Table
  
  ## Purpose
  Adds fields necessary for managing consortium groups including asset value,
  number of quotas, and monthly payment value.
  
  ## New Columns
  - `asset_value` (numeric) - Value of the asset/good being offered
  - `total_quotas` (integer) - Total number of quotas in this group
  - `monthly_value` (numeric) - Monthly payment value for each quota
  
  ## Notes
  - All fields are required for consortium management
  - Numeric fields use NUMERIC type for precise financial calculations
*/

-- Add consortium management fields to groups table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'groups' AND column_name = 'asset_value'
  ) THEN
    ALTER TABLE public.groups ADD COLUMN asset_value NUMERIC(15, 2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'groups' AND column_name = 'total_quotas'
  ) THEN
    ALTER TABLE public.groups ADD COLUMN total_quotas INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'groups' AND column_name = 'monthly_value'
  ) THEN
    ALTER TABLE public.groups ADD COLUMN monthly_value NUMERIC(15, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;