-- Re-grant: the function is now safe (auth.uid() + server-controlled cap),
-- and the server-fn calls it via the user-scoped client.
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text, integer) TO authenticated;