ALTER TABLE public.user_games
  ADD COLUMN IF NOT EXISTS platinum_platforms TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.user_games
  DROP CONSTRAINT IF EXISTS user_games_platinum_platforms_check;

ALTER TABLE public.user_games
  ADD CONSTRAINT user_games_platinum_platforms_check
  CHECK (platinum_platforms <@ ARRAY['steam', 'xbox', 'playstation']::TEXT[]);

GRANT UPDATE (platinum_platforms)
  ON TABLE public.user_games TO authenticated;

UPDATE public.user_games
SET platinum_platforms = ARRAY['steam']::TEXT[]
WHERE is_platinumed = true AND platinum_platforms = '{}';
