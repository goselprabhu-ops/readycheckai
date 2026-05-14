
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS public.phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phone_otps_user_idx ON public.phone_otps(user_id, created_at DESC);

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- Users may read their own OTP rows (no insert/update/delete from client; server fn uses service role via auth-middleware which uses the user's JWT — so allow select only; mutations done via server function with elevated client if needed).
CREATE POLICY "own otp select" ON public.phone_otps FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own otp insert" ON public.phone_otps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own otp update" ON public.phone_otps FOR UPDATE TO authenticated USING (auth.uid() = user_id);
