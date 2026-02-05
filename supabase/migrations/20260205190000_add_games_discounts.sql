-- Add discount columns to games table
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER,
  ADD COLUMN IF NOT EXISTS price_original TEXT;
