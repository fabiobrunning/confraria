/*
  # Add Missing Company Fields
  
  ## Changes
  Adds missing address and social media fields to the companies table
  that are referenced in the frontend code.
  
  ## New Columns
  - description (text, optional) - Company description
  - instagram (text, optional) - Instagram handle
  - address_cep (text, optional) - Postal code
  - address_street (text, optional) - Street name
  - address_number (text, optional) - Street number
  - address_complement (text, optional) - Address complement
  - address_neighborhood (text, optional) - Neighborhood
  - address_city (text, optional) - City name (replaces city)
  - address_state (text, optional) - State abbreviation (replaces state)
  
  ## Notes
  - Preserves existing city and state columns
  - Adds new detailed address columns
*/

-- Add missing columns to companies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN instagram text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'address_cep'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN address_cep text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'address_street'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN address_street text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'address_number'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN address_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'address_complement'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN address_complement text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'address_neighborhood'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN address_neighborhood text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'address_city'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN address_city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'address_state'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN address_state text CHECK (length(address_state) <= 2);
  END IF;
END $$;