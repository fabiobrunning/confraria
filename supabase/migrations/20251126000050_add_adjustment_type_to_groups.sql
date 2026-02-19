-- Migration: Add adjustment_type and adjustment_value fields to groups table
-- These fields indicate if the group has monthly or annual adjustments and the value

-- Create enum type for adjustment
DO $$ BEGIN
    CREATE TYPE public.adjustment_type AS ENUM ('monthly', 'annual', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add columns to groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS adjustment_type public.adjustment_type DEFAULT 'none';

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS adjustment_value DECIMAL(15,2) DEFAULT 0;

-- Add comments
COMMENT ON COLUMN public.groups.adjustment_type IS 'Type of value adjustment: monthly, annual, or none';
COMMENT ON COLUMN public.groups.adjustment_value IS 'Value in BRL to be added to monthly_value and asset_value on each adjustment';
