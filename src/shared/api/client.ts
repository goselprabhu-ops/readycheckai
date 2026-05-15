import { supabase } from "@/integrations/supabase/client";
import { notify } from "./toast";

/**
 * Re-export of the browser Supabase client for feature code.
 * Prefer server functions for any data access — only use this client for
 * realtime subscriptions, auth flows, or operations that must run in-browser.
 */
export { supabase };

/**
 * Wraps a server-fn call with a friendly error toast. Use sparingly — most
 * call sites should use react-query's `onError` / mutation handlers instead.
 */
export async function withErrorToast<T>(
  fn: () => Promise<T>,
  fallbackMessage = "Something went wrong",
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    const message =
      err instanceof Error && err.message ? err.message : fallbackMessage;
    notify.error(fallbackMessage, message);
    return null;
  }
}