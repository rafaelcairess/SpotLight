-- Adiciona colunas extras na tabela user_games para controle manual de horas
ALTER TABLE public.user_games
  ADD COLUMN IF NOT EXISTS hours_played_manual NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hours_override BOOLEAN NOT NULL DEFAULT FALSE;
