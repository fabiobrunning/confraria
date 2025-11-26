-- Migration: Update draws table to allow winner_position >= 1
-- Remove the constraint that requires winner_position >= 5

ALTER TABLE public.draws DROP CONSTRAINT IF EXISTS chk_draws_winner_position;
ALTER TABLE public.draws ADD CONSTRAINT chk_draws_winner_position CHECK (winner_position >= 1);
