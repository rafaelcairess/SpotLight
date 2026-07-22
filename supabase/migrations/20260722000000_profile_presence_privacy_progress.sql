ALTER TABLE public.user_games
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorite_game_app_id INTEGER,
  ADD COLUMN IF NOT EXISTS presence_status TEXT NOT NULL DEFAULT 'online'
    CHECK (presence_status IN ('online', 'away', 'busy', 'invisible')),
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

GRANT UPDATE (favorite_game_app_id, presence_status, last_seen_at)
  ON TABLE public.profiles TO authenticated;

-- Existing permissive policies still decide whether a library is visible.
-- This restrictive policy additionally removes private titles for everyone
-- except their owner, including direct REST queries.
CREATE POLICY "Private games are owner only"
  ON public.user_games AS RESTRICTIVE FOR SELECT
  USING (user_id = auth.uid() OR is_private = false);

-- A private game must not leak through a public Top Games slot.
CREATE POLICY "Private top games are owner only"
  ON public.user_top_games AS RESTRICTIVE FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_games game
      WHERE game.user_id = user_top_games.user_id
        AND game.app_id = user_top_games.app_id
        AND game.is_private = false
    )
  );

CREATE OR REPLACE FUNCTION public.get_profile_progress(target_user_id uuid)
RETURNS TABLE (
  xp integer,
  level integer,
  next_level_xp integer,
  games_count integer,
  completed_count integer,
  platinum_count integer,
  reviews_count integer,
  friends_count integer,
  hours_count integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      (SELECT count(*)::integer FROM public.user_games WHERE user_id = target_user_id) AS games_count,
      (SELECT count(*)::integer FROM public.user_games WHERE user_id = target_user_id AND status = 'completed') AS completed_count,
      (SELECT count(*)::integer FROM public.user_games WHERE user_id = target_user_id AND is_platinumed = true) AS platinum_count,
      (SELECT count(*)::integer FROM public.reviews WHERE user_id = target_user_id) AS reviews_count,
      (SELECT count(*)::integer FROM public.friend_requests WHERE status = 'accepted' AND (requester_id = target_user_id OR addressee_id = target_user_id)) AS friends_count,
      (SELECT least(2000, floor(coalesce(sum(CASE WHEN hours_override THEN hours_played_manual ELSE hours_played END), 0)))::integer FROM public.user_games WHERE user_id = target_user_id) AS hours_count
  ), scored AS (
    SELECT *, (
      games_count * 20
      + completed_count * 80
      + platinum_count * 150
      + reviews_count * 75
      + friends_count * 100
      + hours_count
    )::integer AS total_xp
    FROM stats
  )
  SELECT
    total_xp,
    floor(sqrt(total_xp::numeric / 500))::integer + 1,
    (power(floor(sqrt(total_xp::numeric / 500)) + 1, 2) * 500)::integer,
    games_count,
    completed_count,
    platinum_count,
    reviews_count,
    friends_count,
    hours_count
  FROM scored;
$$;

REVOKE EXECUTE ON FUNCTION public.get_profile_progress(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_progress(uuid) TO anon, authenticated;
