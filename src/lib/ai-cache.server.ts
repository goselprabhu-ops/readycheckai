import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function hashKey(feature: string, model: string, payload: unknown): string {
  const h = createHash("sha256");
  h.update(feature);
  h.update("|");
  h.update(model);
  h.update("|");
  h.update(typeof payload === "string" ? payload : JSON.stringify(payload));
  return `${feature}:${h.digest("hex")}`;
}

export interface AiCacheEntry<T> {
  value: T;
  cached: true;
}

/**
 * Server-only cache wrapper for deterministic AI calls.
 * Same (feature, model, prompt) -> same response within TTL.
 * Cache failures never block the underlying AI call.
 */
export async function withAiCache<T>(
  args: {
    feature: string;
    model: string;
    prompt: unknown; // full request payload to hash
    ttlSeconds?: number;
  },
  produce: () => Promise<T>,
): Promise<T> {
  const key = hashKey(args.feature, args.model, args.prompt);
  const ttl = args.ttlSeconds ?? DEFAULT_TTL_SECONDS;

  try {
    const { data } = await supabaseAdmin
      .from("ai_response_cache")
      .select("response_json, expires_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (data && new Date(data.expires_at).getTime() > Date.now()) {
      return data.response_json as T;
    }
  } catch {
    // cache miss path
  }

  const value = await produce();

  try {
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    await supabaseAdmin.from("ai_response_cache").upsert(
      {
        cache_key: key,
        feature: args.feature,
        model: args.model,
        response_json: value as never,
        expires_at: expiresAt,
      },
      { onConflict: "cache_key" },
    );
  } catch {
    // never let cache writes break the call
  }

  return value;
}
