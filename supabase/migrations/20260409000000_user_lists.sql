-- Listas personalizadas de jogos (Feature: Listas)
-- Usuários podem criar listas temáticas públicas ou privadas.

CREATE TABLE IF NOT EXISTS public.user_lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_list_games (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id   UUID NOT NULL REFERENCES public.user_lists(id) ON DELETE CASCADE,
  app_id    INTEGER NOT NULL,
  note      TEXT,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS user_lists_user_id_idx ON public.user_lists(user_id);
CREATE INDEX IF NOT EXISTS user_list_games_list_id_idx ON public.user_list_games(list_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_list_games_unique ON public.user_list_games(list_id, app_id);

-- RLS
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_list_games ENABLE ROW LEVEL SECURITY;

-- Políticas user_lists
CREATE POLICY "user_lists_select_own" ON public.user_lists
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "user_lists_insert_own" ON public.user_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_lists_update_own" ON public.user_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_lists_delete_own" ON public.user_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas user_list_games (acesso via join com user_lists)
CREATE POLICY "user_list_games_select" ON public.user_list_games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_lists l
      WHERE l.id = list_id AND (l.user_id = auth.uid() OR l.is_public = true)
    )
  );

CREATE POLICY "user_list_games_insert_own" ON public.user_list_games
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_lists l
      WHERE l.id = list_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "user_list_games_delete_own" ON public.user_list_games
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_lists l
      WHERE l.id = list_id AND l.user_id = auth.uid()
    )
  );
