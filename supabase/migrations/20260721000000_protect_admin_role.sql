-- The admin flag is derived from protected auth metadata. Users must never be
-- able to set it through the public profiles API.
UPDATE public.profiles AS profile
SET is_admin = COALESCE(
  (
    SELECT (auth_user.raw_app_meta_data ->> 'role') = 'admin'
    FROM auth.users AS auth_user
    WHERE auth_user.id = profile.user_id
  ),
  false
);

REVOKE INSERT, UPDATE ON TABLE public.profiles FROM authenticated;

GRANT INSERT (
  user_id,
  username,
  display_name,
  bio,
  avatar_url,
  steam_id,
  profile_visibility,
  reviews_visibility,
  library_visibility
) ON TABLE public.profiles TO authenticated;

GRANT UPDATE (
  username,
  display_name,
  bio,
  avatar_url,
  steam_id,
  profile_visibility,
  reviews_visibility,
  library_visibility
) ON TABLE public.profiles TO authenticated;

-- Restrict mutable columns on tables whose RLS policy authorizes the old row.
-- Without column grants, an authorized UPDATE could also rewrite ownership or
-- immutable audit fields in the same request.
REVOKE UPDATE ON TABLE public.notifications FROM authenticated;
GRANT UPDATE (read_at) ON TABLE public.notifications TO authenticated;

REVOKE UPDATE ON TABLE public.user_lists FROM authenticated;
GRANT UPDATE (name, description, is_public, updated_at)
  ON TABLE public.user_lists TO authenticated;

REVOKE UPDATE ON TABLE public.friend_requests FROM authenticated;
GRANT UPDATE (status, updated_at)
  ON TABLE public.friend_requests TO authenticated;

DROP POLICY IF EXISTS "user_lists_update_own" ON public.user_lists;
CREATE POLICY "user_lists_update_own" ON public.user_lists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Destinatário atualiza pedido" ON public.friend_requests;
CREATE POLICY "Destinatário atualiza pedido" ON public.friend_requests
  FOR UPDATE
  USING (addressee_id = auth.uid())
  WITH CHECK (addressee_id = auth.uid());

DROP POLICY IF EXISTS "Usuário atualiza próprias notificações" ON public.notifications;
CREATE POLICY "Usuário atualiza próprias notificações" ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuário autenticado envia feedback" ON public.feedback;
CREATE POLICY "Usuário autenticado envia feedback" ON public.feedback
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

-- These were accidentally created as public tables while configuring Xbox
-- secrets. They contain only generated IDs/timestamps; real secrets belong in
-- Edge Function Secrets and must not be represented by public tables.
DROP TABLE IF EXISTS public."XBOX_CLIENT_ID";
DROP TABLE IF EXISTS public."XBOX_CLIENT_SECRET";

-- Trigger helpers are invoked by PostgreSQL itself and must not be exposed as
-- callable RPC endpoints.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_review_rate_limit() FROM PUBLIC, anon, authenticated;

-- is_friend is required by privacy RLS for signed-in users, but anonymous
-- callers do not need direct RPC access to it.
REVOKE EXECUTE ON FUNCTION public.is_friend(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_friend(uuid, uuid) TO authenticated;

-- Public buckets serve object URLs without a broad SELECT policy. Removing it
-- prevents clients from enumerating every user's avatar object.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
