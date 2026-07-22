ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platinum_showcase_app_ids INTEGER[] NOT NULL DEFAULT '{}';

GRANT UPDATE (platinum_showcase_app_ids)
  ON TABLE public.profiles TO authenticated;
