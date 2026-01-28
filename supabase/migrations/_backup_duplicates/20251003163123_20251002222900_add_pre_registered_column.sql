/*
  # Add pre_registered Column to Profiles Table
  
  ## Changes
  - Add `pre_registered` boolean column to profiles table
  - Default value is false (users who complete full registration)
  - Set to true for members created via pre-registration flow
  
  ## Purpose
  This column helps distinguish between:
  - Fully registered members (pre_registered = false)
  - Pre-registered members waiting to complete their profile (pre_registered = true)
*/

-- Add pre_registered column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    AND column_name = 'pre_registered'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN pre_registered boolean NOT NULL DEFAULT false;
    
    -- Add comment for documentation
    COMMENT ON COLUMN public.profiles.pre_registered IS 'Indicates if the member was pre-registered by an admin and needs to complete their profile';
  END IF;
END $$;