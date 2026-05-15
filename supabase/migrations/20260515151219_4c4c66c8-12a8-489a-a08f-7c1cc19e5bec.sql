-- Migrate legacy 'rules' to 'keyword'
UPDATE public.resume_analyses SET method = 'keyword' WHERE method = 'rules';

-- Replace method CHECK with new vocabulary
ALTER TABLE public.resume_analyses
  DROP CONSTRAINT IF EXISTS resume_analyses_method_check;
ALTER TABLE public.resume_analyses
  ADD CONSTRAINT resume_analyses_method_check
  CHECK (method IN ('keyword','ai','ocr','fallback'));

-- Default to 'ai'
ALTER TABLE public.resume_analyses
  ALTER COLUMN method SET DEFAULT 'ai';

-- Traceability columns
ALTER TABLE public.resume_analyses
  ADD COLUMN IF NOT EXISTS extraction_confidence numeric(3,2),
  ADD COLUMN IF NOT EXISTS parser_status text,
  ADD COLUMN IF NOT EXISTS extraction_error text;

ALTER TABLE public.resume_analyses
  DROP CONSTRAINT IF EXISTS resume_analyses_confidence_bounds;
ALTER TABLE public.resume_analyses
  ADD CONSTRAINT resume_analyses_confidence_bounds
  CHECK (extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1));

ALTER TABLE public.resume_analyses
  DROP CONSTRAINT IF EXISTS resume_analyses_parser_status_check;
ALTER TABLE public.resume_analyses
  ADD CONSTRAINT resume_analyses_parser_status_check
  CHECK (parser_status IS NULL OR parser_status IN (
    'ok','empty_extraction','image_only_pdf','malformed_pdf','oversized','unsupported'
  ));

-- One canonical analysis per upload
CREATE UNIQUE INDEX IF NOT EXISTS resume_analyses_resume_canonical_uidx
  ON public.resume_analyses (resume_id)
  WHERE resume_id IS NOT NULL;

-- UPDATE policy so pipeline can upsert the canonical record
DROP POLICY IF EXISTS "own ra update" ON public.resume_analyses;
CREATE POLICY "own ra update" ON public.resume_analyses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for lookups by resume
CREATE INDEX IF NOT EXISTS resume_analyses_resume_idx
  ON public.resume_analyses (resume_id);