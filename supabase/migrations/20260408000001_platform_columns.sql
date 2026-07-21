-- ============================================================
-- Migration: Colunas para Xbox, PSN e rastreamento de plataforma
-- Data: 2026-04-08
-- ============================================================

-- Adiciona campos Xbox e PSN na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xbox_id          TEXT,
  ADD COLUMN IF NOT EXISTS xbox_gamertag    TEXT,
  ADD COLUMN IF NOT EXISTS xbox_last_synced TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS psn_id           TEXT,
  ADD COLUMN IF NOT EXISTS psn_online_id    TEXT,
  ADD COLUMN IF NOT EXISTS psn_last_synced  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS steam_library_private BOOLEAN DEFAULT FALSE;

-- Adiciona coluna de origem dos jogos em user_games
-- Valores: 'steam' | 'xbox' | 'psn' | 'manual'
ALTER TABLE public.user_games
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Índice para busca por plataforma
CREATE INDEX IF NOT EXISTS idx_user_games_source ON public.user_games (source);

-- Índice para busca de usuários por Steam ID
CREATE INDEX IF NOT EXISTS idx_profiles_steam_id ON public.profiles (steam_id);

-- Índice para busca de usuários por Xbox ID
CREATE INDEX IF NOT EXISTS idx_profiles_xbox_id ON public.profiles (xbox_id);

-- Índice para busca de usuários por PSN ID
CREATE INDEX IF NOT EXISTS idx_profiles_psn_id ON public.profiles (psn_id);
