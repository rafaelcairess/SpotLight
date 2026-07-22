-- A private title must not be discoverable through reviews, reactions, or
-- public custom lists. These restrictive policies complement the existing
-- permissive visibility policies without changing write permissions.

CREATE POLICY "Private game reviews are owner only"
  ON public.reviews AS RESTRICTIVE FOR SELECT
  USING (
    user_id = auth.uid()
    OR NOT EXISTS (
      SELECT 1
      FROM public.user_games game
      WHERE game.user_id = reviews.user_id
        AND game.app_id = reviews.app_id
        AND game.is_private = true
    )
  );

CREATE POLICY "Private review reactions are hidden"
  ON public.review_reactions AS RESTRICTIVE FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.reviews review
      WHERE review.id = review_reactions.review_id
    )
  );

CREATE POLICY "Private games are hidden from public lists"
  ON public.user_list_games AS RESTRICTIVE FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_lists list_owner
      WHERE list_owner.id = user_list_games.list_id
        AND (
          list_owner.user_id = auth.uid()
          OR NOT EXISTS (
            SELECT 1
            FROM public.user_games game
            WHERE game.user_id = list_owner.user_id
              AND game.app_id = user_list_games.app_id
              AND game.is_private = true
          )
        )
    )
  );
