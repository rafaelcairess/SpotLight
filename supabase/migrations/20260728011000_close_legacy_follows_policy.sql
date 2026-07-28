-- Remove legacy SELECT policies without relying on their human-readable names.
-- Some early migrations used accented identifiers, which can be represented
-- differently by migration tools and leave the old public policy active.
DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'follows'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON public.follows',
      existing_policy.policyname
    );
  END LOOP;
END;
$$;

CREATE POLICY "Follow participants can view relationships"
  ON public.follows
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (follower_id = auth.uid() OR following_id = auth.uid())
  );
