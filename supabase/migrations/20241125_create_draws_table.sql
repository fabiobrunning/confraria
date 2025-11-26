-- Migration: Create draws table for the lottery system
-- Run this in your Supabase SQL Editor

-- Create draws table
CREATE TABLE IF NOT EXISTS public.draws (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  winning_quota_id UUID REFERENCES public.quotas(id) ON DELETE SET NULL,
  winning_number INTEGER NOT NULL,
  drawn_numbers JSONB NOT NULL DEFAULT '[]',
  winner_position INTEGER NOT NULL,
  draw_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

  CONSTRAINT chk_draws_winner_position CHECK (winner_position >= 5),
  CONSTRAINT chk_draws_winning_number CHECK (winning_number >= 1)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_draws_group_id ON public.draws(group_id);
CREATE INDEX IF NOT EXISTS idx_draws_winning_quota_id ON public.draws(winning_quota_id);
CREATE INDEX IF NOT EXISTS idx_draws_deleted_at ON public.draws(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_draws_active ON public.draws(group_id) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage draws" ON public.draws
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "All authenticated users can view draws" ON public.draws
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Add comments
COMMENT ON TABLE public.draws IS 'Lottery draw history for consortium groups';
COMMENT ON COLUMN public.draws.drawn_numbers IS 'JSONB array of all numbers drawn in sequence';
COMMENT ON COLUMN public.draws.winner_position IS 'Position of winner in the draw sequence (minimum 5)';
