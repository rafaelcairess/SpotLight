-- ============================================================
-- Migration: RLS completo para todas as tabelas
-- Data: 2026-04-08
-- ============================================================

-- ----------------------------------------------------------------
-- GAMES (catálogo público, apenas service role escreve)
-- ----------------------------------------------------------------
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games visíveis por todos"
  ON public.games FOR SELECT
  USING (true);

-- ----------------------------------------------------------------
-- STEAM_APPS (registro público, apenas service role escreve)
-- ----------------------------------------------------------------
ALTER TABLE public.steam_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Steam apps visíveis por todos"
  ON public.steam_apps FOR SELECT
  USING (true);

-- ----------------------------------------------------------------
-- GAME_LOCALIZATIONS (público)
-- ----------------------------------------------------------------
ALTER TABLE public.game_localizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Localizações visíveis por todos"
  ON public.game_localizations FOR SELECT
  USING (true);

-- ----------------------------------------------------------------
-- DAILY_FEATURED (público)
-- ----------------------------------------------------------------
ALTER TABLE public.daily_featured ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Featured visível por todos"
  ON public.daily_featured FOR SELECT
  USING (true);

-- ----------------------------------------------------------------
-- PRICE_HISTORY (público)
-- ----------------------------------------------------------------
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Histórico de preços visível por todos"
  ON public.price_history FOR SELECT
  USING (true);

-- ----------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Leitura: perfil público OU próprio perfil
CREATE POLICY "Perfis públicos visíveis por todos"
  ON public.profiles FOR SELECT
  USING (
    profile_visibility = 'public'
    OR user_id = auth.uid()
  );

-- Insert: apenas o próprio usuário
CREATE POLICY "Usuário insere próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Update: apenas o próprio usuário
CREATE POLICY "Usuário atualiza próprio perfil"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Delete: apenas o próprio usuário
CREATE POLICY "Usuário deleta próprio perfil"
  ON public.profiles FOR DELETE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- USER_GAMES
-- ----------------------------------------------------------------
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;

-- Leitura: apenas próprios jogos
-- (visibilidade da biblioteca é aplicada na camada de app via profiles)
CREATE POLICY "Usuário vê próprios jogos"
  ON public.user_games FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuário insere próprios jogos"
  ON public.user_games FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário atualiza próprios jogos"
  ON public.user_games FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário deleta próprios jogos"
  ON public.user_games FOR DELETE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- USER_TOP_GAMES
-- ----------------------------------------------------------------
ALTER TABLE public.user_top_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Top games visíveis por todos"
  ON public.user_top_games FOR SELECT
  USING (true);

CREATE POLICY "Usuário insere próprio top"
  ON public.user_top_games FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário atualiza próprio top"
  ON public.user_top_games FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário deleta próprio top"
  ON public.user_top_games FOR DELETE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- REVIEWS
-- ----------------------------------------------------------------
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews são públicas
CREATE POLICY "Reviews visíveis por todos"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Usuário autenticado insere review"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Usuário atualiza própria review"
  ON public.reviews FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário deleta própria review"
  ON public.reviews FOR DELETE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- REVIEW_REACTIONS
-- ----------------------------------------------------------------
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reações visíveis por todos"
  ON public.review_reactions FOR SELECT
  USING (true);

CREATE POLICY "Usuário autenticado insere reação"
  ON public.review_reactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Usuário atualiza própria reação"
  ON public.review_reactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário deleta própria reação"
  ON public.review_reactions FOR DELETE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- FOLLOWS
-- ----------------------------------------------------------------
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Follows são públicos (quem segue quem)
CREATE POLICY "Follows visíveis por todos"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Usuário segue outros"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND follower_id = auth.uid());

CREATE POLICY "Usuário deixa de seguir"
  ON public.follows FOR DELETE
  USING (follower_id = auth.uid());

-- ----------------------------------------------------------------
-- FRIEND_REQUESTS
-- ----------------------------------------------------------------
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Apenas as partes envolvidas veem o pedido
CREATE POLICY "Partes envolvidas veem pedido de amizade"
  ON public.friend_requests FOR SELECT
  USING (
    requester_id = auth.uid()
    OR addressee_id = auth.uid()
  );

CREATE POLICY "Usuário envia pedido de amizade"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND requester_id = auth.uid());

-- Apenas o destinatário aceita/recusa (UPDATE)
CREATE POLICY "Destinatário atualiza pedido"
  ON public.friend_requests FOR UPDATE
  USING (addressee_id = auth.uid());

-- Apenas o remetente cancela (DELETE)
CREATE POLICY "Remetente cancela pedido"
  ON public.friend_requests FOR DELETE
  USING (requester_id = auth.uid());

-- ----------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Cada usuário vê apenas suas notificações
CREATE POLICY "Usuário vê próprias notificações"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Apenas usuário marca como lida (UPDATE)
CREATE POLICY "Usuário atualiza próprias notificações"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Usuário deleta próprias notificações"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- PRICE_ALERTS
-- ----------------------------------------------------------------
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprios alertas"
  ON public.price_alerts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuário cria próprios alertas"
  ON public.price_alerts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Usuário atualiza próprios alertas"
  ON public.price_alerts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário deleta próprios alertas"
  ON public.price_alerts FOR DELETE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- FEEDBACK (política de SELECT admin já existe na migration anterior)
-- ----------------------------------------------------------------
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode enviar feedback
CREATE POLICY "Usuário autenticado envia feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Usuário vê apenas o próprio feedback
CREATE POLICY "Usuário vê próprio feedback"
  ON public.feedback FOR SELECT
  USING (user_id = auth.uid());
-- Nota: a política admin da migration anterior sobrescreve para admins
