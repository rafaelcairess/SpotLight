-- Switch feedback admin policy to JWT role claim

DROP POLICY IF EXISTS "Feedback selectable by admin" ON public.feedback;

CREATE POLICY "Feedback selectable by admin"
  ON public.feedback
  FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
