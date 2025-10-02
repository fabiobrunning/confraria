/*
  # Add Missing Profile Fields
  
  ## Changes
  Adds address and social media fields to the profiles table that are
  referenced in the Profile.tsx page.
  
  ## New Columns
  - instagram (text, optional) - Instagram handle
  - address_cep (text, optional) - Postal code
  - address_street (text, optional) - Street name
  - address_number (text, optional) - Street number
  - address_complement (text, optional) - Address complement
  - address_neighborhood (text, optional) - Neighborhood
  - address_city (text, optional) - City name
  - address_state (text, optional) - State abbreviation (2 chars)
*/

-- Add missing columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN instagram text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address_cep'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN address_cep text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address_street'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN address_street text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address_number'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN address_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address_complement'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN address_complement text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address_neighborhood'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN address_neighborhood text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address_city'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN address_city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address_state'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN address_state text CHECK (length(address_state) <= 2);
  END IF;
END $$;