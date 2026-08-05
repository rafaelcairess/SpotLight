-- Follow-up hardening after the controlled 2026-08-04 penetration test.

-- Browser length limits are UX only. Reject oversized profile content at the
-- database boundary so direct REST requests cannot create unbounded values.
CREATE OR REPLACE FUNCTION public.guard_profile_content_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF auth.uid() IS NULL OR OLD.user_id <> auth.uid() OR NEW.user_id <> OLD.user_id THEN
      RAISE EXCEPTION 'PROFILE_IDENTITY_MISMATCH';
    END IF;

    NEW.username := lower(btrim(NEW.username));
    NEW.display_name := nullif(btrim(NEW.display_name), '');
    NEW.bio := nullif(btrim(NEW.bio), '');

    IF NEW.username !~ '^[a-z0-9_]{3,20}$' THEN
      RAISE EXCEPTION 'PROFILE_USERNAME_INVALID';
    END IF;
    IF NEW.display_name IS NOT NULL AND char_length(NEW.display_name) > 50 THEN
      RAISE EXCEPTION 'PROFILE_DISPLAY_NAME_INVALID';
    END IF;
    IF NEW.bio IS NOT NULL AND char_length(NEW.bio) > 300 THEN
      RAISE EXCEPTION 'PROFILE_BIO_INVALID';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_profile_content_update()
  FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS profile_content_update_guard ON public.profiles;
CREATE TRIGGER profile_content_update_guard
  BEFORE UPDATE OF username, display_name, bio ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_content_update();

-- Custom lists previously trusted timestamps and accepted unbounded text.
-- The trigger also imposes durable quotas against storage/notification abuse.
REVOKE INSERT, UPDATE ON TABLE public.user_lists FROM authenticated;
GRANT INSERT (user_id, name, description, is_public)
  ON TABLE public.user_lists TO authenticated;
GRANT UPDATE (name, description, is_public)
  ON TABLE public.user_lists TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_user_list_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'LIST_AUTH_REQUIRED';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'LIST_OWNER_MISMATCH';
    END IF;
    IF (SELECT count(*) FROM public.user_lists WHERE user_id = auth.uid()) >= 100 THEN
      RAISE EXCEPTION 'LIST_LIMIT_REACHED';
    END IF;
    IF NOT public.consume_function_rate_limit(auth.uid(), 'list-create-hour', 30, 3600) THEN
      RAISE EXCEPTION 'LIST_RATE_LIMIT';
    END IF;
    NEW.created_at := now();
  ELSE
    IF OLD.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'LIST_OWNER_MISMATCH';
    END IF;
    NEW.id := OLD.id;
    NEW.user_id := OLD.user_id;
    NEW.created_at := OLD.created_at;
  END IF;

  NEW.name := btrim(NEW.name);
  NEW.description := nullif(btrim(NEW.description), '');
  NEW.updated_at := now();

  IF char_length(NEW.name) NOT BETWEEN 1 AND 60 THEN
    RAISE EXCEPTION 'LIST_NAME_INVALID';
  END IF;
  IF NEW.description IS NOT NULL AND char_length(NEW.description) > 200 THEN
    RAISE EXCEPTION 'LIST_DESCRIPTION_INVALID';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_user_list_write()
  FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS user_list_write_guard ON public.user_lists;
CREATE TRIGGER user_list_write_guard
  BEFORE INSERT OR UPDATE ON public.user_lists
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_list_write();

REVOKE INSERT, UPDATE ON TABLE public.user_list_games FROM authenticated;
GRANT INSERT (list_id, app_id, note)
  ON TABLE public.user_list_games TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_user_list_game_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  list_owner UUID;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'LIST_AUTH_REQUIRED';
  END IF;

  SELECT user_id INTO list_owner
  FROM public.user_lists
  WHERE id = NEW.list_id;

  IF list_owner IS NULL OR list_owner <> auth.uid() THEN
    RAISE EXCEPTION 'LIST_OWNER_MISMATCH';
  END IF;
  IF NEW.app_id <= 0 THEN
    RAISE EXCEPTION 'LIST_GAME_INVALID';
  END IF;
  IF (SELECT count(*) FROM public.user_list_games WHERE list_id = NEW.list_id) >= 1000 THEN
    RAISE EXCEPTION 'LIST_GAME_LIMIT_REACHED';
  END IF;
  IF NOT public.consume_function_rate_limit(auth.uid(), 'list-game-minute', 120, 60) THEN
    RAISE EXCEPTION 'LIST_GAME_RATE_LIMIT';
  END IF;

  NEW.note := nullif(btrim(NEW.note), '');
  NEW.added_at := now();
  IF NEW.note IS NOT NULL AND char_length(NEW.note) > 500 THEN
    RAISE EXCEPTION 'LIST_NOTE_INVALID';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_user_list_game_insert()
  FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS user_list_game_insert_guard ON public.user_list_games;
CREATE TRIGGER user_list_game_insert_guard
  BEFORE INSERT ON public.user_list_games
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_list_game_insert();
