-- Enforce the privacy choices exposed by ProfileEdit at the database layer.
-- UI checks are only presentation; direct REST requests must obey the same rules.

CREATE POLICY "Friends can view friend profiles"
  ON public.profiles FOR SELECT
  USING (
    profile_visibility = 'friends'
    AND public.is_friend(auth.uid(), user_id)
  );

CREATE POLICY "Visible libraries can be read"
  ON public.user_games FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.user_id = user_games.user_id
        AND (
          profile.library_visibility = 'public'
          OR (
            profile.library_visibility = 'friends'
            AND public.is_friend(auth.uid(), profile.user_id)
          )
        )
        AND (
          profile.profile_visibility = 'public'
          OR (
            profile.profile_visibility = 'friends'
            AND public.is_friend(auth.uid(), profile.user_id)
          )
        )
    )
  );

DROP POLICY IF EXISTS "Reviews visíveis por todos" ON public.reviews;

CREATE POLICY "Visible reviews can be read"
  ON public.reviews FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.user_id = reviews.user_id
        AND (
          profile.reviews_visibility = 'public'
          OR (
            profile.reviews_visibility = 'friends'
            AND public.is_friend(auth.uid(), profile.user_id)
          )
        )
        AND (
          profile.profile_visibility = 'public'
          OR (
            profile.profile_visibility = 'friends'
            AND public.is_friend(auth.uid(), profile.user_id)
          )
        )
    )
  );
