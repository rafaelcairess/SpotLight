-- Colunas para rastrear conquistas/troféus por jogo
ALTER TABLE public.user_games
  ADD COLUMN IF NOT EXISTS achievement_unlocked integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS achievement_total integer NOT NULL DEFAULT 0;
