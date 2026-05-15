-- 1. Add a status column for progress tracking (queued / processing / ready / failed)
ALTER TABLE public.resume_analyses
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ready'
    CHECK (status IN ('queued', 'processing', 'ready', 'failed'));

CREATE INDEX IF NOT EXISTS idx_resume_analyses_status_created
  ON public.resume_analyses (status, created_at DESC);

-- 2. SECURITY DEFINER cleanup helper. Locked to service_role only.
CREATE OR REPLACE FUNCTION public.prune_failed_resume_analyses(_older_than_days integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted integer;
BEGIN
  WITH del AS (
    DELETE FROM public.resume_analyses
    WHERE created_at < now() - make_interval(days => GREATEST(_older_than_days, 1))
      AND (
        parser_status IS NOT NULL
        AND parser_status <> 'ok'
      )
    RETURNING 1
  )
  SELECT count(*) INTO _deleted FROM del;

  -- Trace cleanup runs to system_events for the admin diagnostics page.
  INSERT INTO public.system_events
    (event_type, severity, source, message, metadata)
  VALUES
    ('resume_cleanup', 'info', 'cron',
     'pruned failed resume analyses',
     jsonb_build_object('deleted', _deleted, 'older_than_days', _older_than_days));

  RETURN _deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prune_failed_resume_analyses(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_failed_resume_analyses(integer) TO service_role;

-- 3. Schedule weekly cleanup (Sunday 02:00 UTC). Re-creating is idempotent.
DO $$
BEGIN
  PERFORM cron.unschedule('prune-failed-resume-analyses');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'prune-failed-resume-analyses',
  '0 2 * * 0',
  $$ SELECT public.prune_failed_resume_analyses(30); $$
);