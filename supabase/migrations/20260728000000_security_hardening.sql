-- Security hardening identified by the 2026-07-28 audit.

-- Platform identities are established by OAuth/OpenID callbacks running with
-- service-role privileges. Browser clients must not assign them directly.
REVOKE INSERT (steam_id) ON TABLE public.profiles FROM authenticated;
REVOKE UPDATE (steam_id) ON TABLE public.profiles FROM authenticated;

-- Reconcile legacy duplicates without guessing ownership. The account created
-- by the verified Steam OpenID callback has a deterministic internal email and
-- keeps the identity. Manually assigned duplicates are disconnected. If no
-- verified account exists, every duplicate is disconnected and must reconnect.
DO $$
BEGIN
  WITH duplicated AS (
    SELECT steam_id
    FROM public.profiles
    WHERE steam_id IS NOT NULL AND btrim(steam_id) <> ''
    GROUP BY steam_id
    HAVING count(*) > 1
  )
  UPDATE public.profiles AS profile
  SET
    steam_id = NULL,
    steam_last_synced = NULL
  FROM duplicated
  WHERE profile.steam_id = duplicated.steam_id
    AND NOT EXISTS (
      SELECT 1
      FROM auth.users AS auth_user
      WHERE auth_user.id = profile.user_id
        AND lower(auth_user.email) =
          lower('steam_' || duplicated.steam_id || '@steam.local')
    );

  -- A remaining duplicate would mean inconsistent verified Auth identities.
  IF EXISTS (
    SELECT steam_id
    FROM public.profiles
    WHERE steam_id IS NOT NULL AND btrim(steam_id) <> ''
    GROUP BY steam_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Verified duplicate profiles.steam_id values require manual review';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_steam_id_unique
  ON public.profiles (steam_id)
  WHERE steam_id IS NOT NULL AND btrim(steam_id) <> '';

-- The participants-only policy from the base schema is sufficient for
-- is_friend(auth.uid(), other_user). Publishing every accepted pair exposes
-- the complete social graph.
DROP POLICY IF EXISTS "Accepted friendships are visible"
  ON public.friend_requests;

-- Durable, atomic rate-limit state for Edge Functions. No browser role receives
-- table access; only a tightly scoped function callable by service_role does.
CREATE TABLE IF NOT EXISTS public.function_rate_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (char_length(action) BETWEEN 1 AND 80),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (user_id, action)
);

ALTER TABLE public.function_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.function_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_function_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  allowed BOOLEAN;
BEGIN
  IF p_user_id IS NULL
    OR p_action IS NULL
    OR char_length(p_action) NOT BETWEEN 1 AND 80
    OR p_limit NOT BETWEEN 1 AND 1000
    OR p_window_seconds NOT BETWEEN 1 AND 86400
  THEN
    RETURN false;
  END IF;

  INSERT INTO public.function_rate_limits AS rate_limit (
    user_id,
    action,
    window_started_at,
    request_count
  )
  VALUES (p_user_id, p_action, now(), 1)
  ON CONFLICT (user_id, action) DO UPDATE
  SET
    window_started_at = CASE
      WHEN rate_limit.window_started_at
        <= now() - make_interval(secs => p_window_seconds)
      THEN now()
      ELSE rate_limit.window_started_at
    END,
    request_count = CASE
      WHEN rate_limit.window_started_at
        <= now() - make_interval(secs => p_window_seconds)
      THEN 1
      ELSE rate_limit.request_count + 1
    END
  RETURNING request_count <= p_limit INTO allowed;

  RETURN allowed;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_function_rate_limit(UUID, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_function_rate_limit(UUID, TEXT, INTEGER, INTEGER)
  TO service_role;

-- Review throttling belongs in PostgreSQL, not localStorage, because browser
-- storage can be cleared or modified by the user.
CREATE OR REPLACE FUNCTION public.enforce_review_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'REVIEW_AUTHOR_MISMATCH';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.reviews
    WHERE user_id = auth.uid()
      AND created_at > now() - interval '20 seconds'
  ) THEN
    RAISE EXCEPTION 'REVIEW_RATE_LIMIT';
  END IF;

  NEW.created_at := now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_review_rate_limit()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS review_rate_limit ON public.reviews;
CREATE TRIGGER review_rate_limit
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_rate_limit();

-- These restrictive policies complement the bucket's existing upload policy.
-- They enforce ownership, extension and declared MIME even if another
-- permissive policy is accidentally added later.
CREATE POLICY "Avatar uploads require safe owner path"
  ON storage.objects AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
    AND lower(coalesce(metadata ->> 'mimetype', ''))
      IN ('image/jpeg', 'image/png', 'image/webp')
  );

CREATE POLICY "Avatar updates require safe owner path"
  ON storage.objects AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
    AND lower(coalesce(metadata ->> 'mimetype', ''))
      IN ('image/jpeg', 'image/png', 'image/webp')
  );

CREATE POLICY "Avatar deletes require owner path"
  ON storage.objects AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
