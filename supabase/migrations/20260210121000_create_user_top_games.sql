-- User top games (Top 5)
CREATE TABLE IF NOT EXISTS public.user_top_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id INTEGER NOT NULL,
  position SMALLINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_top_games_position_check CHECK (position BETWEEN 1 AND 5),
  CONSTRAINT user_top_games_unique_position UNIQUE (user_id, position),
  CONSTRAINT user_top_games_unique_app UNIQUE (user_id, app_id)
);

CREATE INDEX IF NOT EXISTS idx_user_top_games_user_id ON public.user_top_games(user_id);
CREATE INDEX IF NOT EXISTS idx_user_top_games_app_id ON public.user_top_games(app_id);

ALTER TABLE public.user_top_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User top games are viewable by everyone"
  ON public.user_top_games
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own top games"
  ON public.user_top_games
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own top games"
  ON public.user_top_games
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own top games"
  ON public.user_top_games
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_top_games_updated_at
  BEFORE UPDATE ON public.user_top_games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
