
CREATE TABLE IF NOT EXISTS public.content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('question','assessment','recommendation','profile','public_profile','other')),
  entity_id uuid,
  entity_ref text,
  reason text NOT NULL CHECK (reason IN ('inaccurate','offensive','spam','plagiarism','other')),
  notes text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','resolved','dismissed')),
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own flags" ON public.content_flags
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "users view own flags" ON public.content_flags
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "admins manage flags" ON public.content_flags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_content_flags_status ON public.content_flags(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_flags_entity ON public.content_flags(entity_type, entity_id);

CREATE TRIGGER set_content_flags_updated_at
  BEFORE UPDATE ON public.content_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
