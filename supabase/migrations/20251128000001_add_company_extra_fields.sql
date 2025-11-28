/*
  # Add Extra Company Fields

  ## Changes
  Adds website, logo and business type fields to companies table

  ## New Columns
  - website (text, optional) - Company website URL
  - logo_url (text, optional) - URL to company logo
  - business_type (text, optional) - Business segment/type
  - facebook (text, optional) - Facebook page
  - linkedin (text, optional) - LinkedIn profile
  - whatsapp (text, optional) - WhatsApp number
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'website'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN website text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN logo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'business_type'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN business_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'facebook'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN facebook text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'linkedin'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN linkedin text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN whatsapp text;
  END IF;
END $$;
