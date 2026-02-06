-- Privacy settings + friends + notifications

-- 1) Privacy columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS reviews_visibility TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS library_visibility TEXT NOT NULL DEFAULT 'public';

ALTER TABLE public.profiles
  ADD CONSTRAINT IF NOT EXISTS profiles_profile_visibility_check
  CHECK (profile_visibility IN ('public', 'friends', 'private'));

ALTER TABLE public.profiles
  ADD CONSTRAINT IF NOT EXISTS profiles_reviews_visibility_check
  CHECK (reviews_visibility IN ('public', 'friends', 'private'));

ALTER TABLE public.profiles
  ADD CONSTRAINT IF NOT EXISTS profiles_library_visibility_check
  CHECK (library_visibility IN ('public', 'friends', 'private'));

-- 2) Friend requests + notifications enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friend_request_status') THEN
    CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'declined');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE public.notification_type AS ENUM ('friend_request', 'friend_accept', 'message');
  END IF;
END $$;

-- 3) Friend requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.friend_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT friend_requests_unique UNIQUE (requester_id, addressee_id),
  CONSTRAINT friend_requests_no_self CHECK (requester_id <> addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON public.friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_addressee ON public.friend_requests(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- 4) Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type public.notification_type NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5) Updated-at triggers
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Helper function: check friendship (accepted requests)
CREATE OR REPLACE FUNCTION public.is_friend(viewer UUID, owner UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friend_requests fr
    WHERE fr.status = 'accepted'
      AND (
        (fr.requester_id = viewer AND fr.addressee_id = owner)
        OR (fr.requester_id = owner AND fr.addressee_id = viewer)
      )
  );
$$;

-- 7) RLS policies: profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by privacy"
  ON public.profiles
  FOR SELECT
  USING (
    profile_visibility = 'public'
    OR auth.uid() = user_id
    OR (profile_visibility = 'friends' AND public.is_friend(auth.uid(), user_id))
  );

-- 8) RLS policies: user_games
DROP POLICY IF EXISTS "User games are viewable by everyone" ON public.user_games;

CREATE POLICY "User games are viewable by privacy"
  ON public.user_games
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_games.user_id
        AND (
          p.library_visibility = 'public'
          OR (p.library_visibility = 'friends' AND public.is_friend(auth.uid(), p.user_id))
        )
    )
  );

-- 9) RLS policies: reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;

CREATE POLICY "Reviews are viewable by privacy"
  ON public.reviews
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = reviews.user_id
        AND (
          p.reviews_visibility = 'public'
          OR (p.reviews_visibility = 'friends' AND public.is_friend(auth.uid(), p.user_id))
        )
    )
  );

-- 10) RLS policies: friend_requests
CREATE POLICY "Friend requests selectable by participants"
  ON public.friend_requests
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Friend requests insert by requester"
  ON public.friend_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Friend requests update by addressee"
  ON public.friend_requests
  FOR UPDATE
  USING (auth.uid() = addressee_id);

CREATE POLICY "Friend requests delete by participants"
  ON public.friend_requests
  FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 11) RLS policies: notifications
CREATE POLICY "Notifications selectable by owner"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Notifications insert by actor"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = actor_id OR auth.uid() = user_id);

CREATE POLICY "Notifications update by owner"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Notifications delete by owner"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);
