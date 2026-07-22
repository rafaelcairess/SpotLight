ALTER TABLE public.user_games
  ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS playtime_2weeks NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS user_games_recent_activity_idx
  ON public.user_games (user_id, last_played_at DESC)
  WHERE last_played_at IS NOT NULL;
