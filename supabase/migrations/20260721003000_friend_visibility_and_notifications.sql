CREATE POLICY "Accepted friendships are visible"
  ON public.friend_requests FOR SELECT
  USING (status = 'accepted');

CREATE OR REPLACE FUNCTION public.notify_friend_request_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_username TEXT;
BEGIN
  SELECT username INTO actor_username
  FROM public.profiles
  WHERE user_id = CASE WHEN TG_OP = 'INSERT' THEN NEW.requester_id ELSE NEW.addressee_id END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, actor_id, type, message, link)
    VALUES (
      NEW.addressee_id,
      NEW.requester_id,
      'friend_request',
      'Você recebeu um novo pedido de amizade.',
      CASE WHEN actor_username IS NULL THEN NULL ELSE '/u/' || actor_username END
    );
  ELSIF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO public.notifications (user_id, actor_id, type, message, link)
    VALUES (
      NEW.requester_id,
      NEW.addressee_id,
      'friend_accept',
      'Seu pedido de amizade foi aceito.',
      CASE WHEN actor_username IS NULL THEN NULL ELSE '/u/' || actor_username END
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_friend_request_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER notify_friend_request_insert
  AFTER INSERT ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request_change();

CREATE TRIGGER notify_friend_request_accept
  AFTER UPDATE OF status ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request_change();
