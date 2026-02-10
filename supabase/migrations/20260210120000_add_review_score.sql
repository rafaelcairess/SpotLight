-- Add numeric score to reviews for ranking and recommendation quality.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS score SMALLINT;

-- Backfill existing reviews with a neutral-positive mapping.
UPDATE public.reviews
SET score = CASE
  WHEN is_positive THEN 80
  ELSE 40
END
WHERE score IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_score_range_check'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_score_range_check
      CHECK (score BETWEEN 0 AND 100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_app_id ON public.reviews(app_id);
CREATE INDEX IF NOT EXISTS idx_reviews_score ON public.reviews(score);
