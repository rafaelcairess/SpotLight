ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS comments_permission TEXT NOT NULL DEFAULT 'public'
  CHECK (comments_permission IN ('public', 'friends', 'disabled'));

CREATE TABLE IF NOT EXISTS public.profile_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 600),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_comments_profile_created_idx
  ON public.profile_comments (profile_user_id, created_at DESC);

ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile comments follow profile visibility"
  ON public.profile_comments FOR SELECT
  USING (
    profile_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles profile
      WHERE profile.user_id = profile_user_id
        AND (
          profile.profile_visibility = 'public'
          OR (profile.profile_visibility = 'friends' AND public.is_friend(auth.uid(), profile_user_id))
        )
    )
  );

CREATE POLICY "Allowed users comment on profiles"
  ON public.profile_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND profile_user_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles profile
      WHERE profile.user_id = profile_user_id
        AND (
          profile.comments_permission = 'public'
          OR (profile.comments_permission = 'friends' AND public.is_friend(auth.uid(), profile_user_id))
        )
    )
  );

CREATE POLICY "Authors edit profile comments"
  ON public.profile_comments FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors or profile owners delete comments"
  ON public.profile_comments FOR DELETE
  USING (author_id = auth.uid() OR profile_user_id = auth.uid());

REVOKE UPDATE ON TABLE public.profile_comments FROM authenticated;
GRANT UPDATE (content, updated_at) ON TABLE public.profile_comments TO authenticated;
GRANT SELECT ON TABLE public.profile_comments TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.profile_comments TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_profile_comment_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profile_comments
    WHERE author_id = NEW.author_id
      AND created_at > now() - interval '20 seconds'
  ) THEN
    RAISE EXCEPTION 'COMMENT_RATE_LIMIT';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_profile_comment_rate_limit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER profile_comment_rate_limit
  BEFORE INSERT ON public.profile_comments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_comment_rate_limit();

DROP POLICY IF EXISTS "Usuário envia pedido de amizade" ON public.friend_requests;
CREATE POLICY "Usuário envia pedido de amizade"
  ON public.friend_requests FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND requester_id = auth.uid()
    AND addressee_id <> auth.uid()
    AND status = 'pending'
  );

CREATE UNIQUE INDEX IF NOT EXISTS friend_requests_active_pair_unique
  ON public.friend_requests (
    LEAST(requester_id, addressee_id),
    GREATEST(requester_id, addressee_id)
  )
  WHERE status IN ('pending', 'accepted');

DROP POLICY IF EXISTS "Remetente cancela pedido" ON public.friend_requests;
CREATE POLICY "Partes removem amizade ou pedido"
  ON public.friend_requests FOR DELETE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

GRANT UPDATE (comments_permission) ON TABLE public.profiles TO authenticated;
