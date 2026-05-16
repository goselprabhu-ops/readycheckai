import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const createLovableAiGatewayProvider = (lovableApiKey: string) =>
  createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

export const DEFAULT_MODEL = "google/gemini-3-flash-preview";

/**
 * Tiered models — pick by workload, not by reflex. All routed through
 * Lovable AI Gateway so we never expose a provider name to end users.
 *  - cheap:    classification / short rewrites / batch summaries
 *  - default:  general chat, evaluation, recommendations
 *  - reasoning: hard reasoning, long roadmaps, multi-step planning
 */
export const MODEL_TIERS = {
  cheap: "google/gemini-3.1-flash-lite-preview",
  default: DEFAULT_MODEL,
  reasoning: "google/gemini-3.1-pro-preview",
} as const;

export type ModelTier = keyof typeof MODEL_TIERS;

/**
 * Run an AI call with retry; on terminal failure, return a fallback value.
 * Keeps user-facing surfaces from crashing on transient gateway issues.
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  opts?: { attempts?: number; baseMs?: number; capMs?: number },
): Promise<T> {
  try {
    return await withRetry(fn, opts);
  } catch (err) {
    console.error("[ai] withFallback caught after retries:", err);
    return fallback;
  }
}

/**
 * Retry an async AI call with exponential backoff. Retries on transient
 * failures (429, 5xx, network errors); fails fast on 4xx (except 429) and
 * on AiCapError (daily user cap is not transient).
 *
 * Defaults: 3 attempts, base delay 400ms, cap 4s.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseMs?: number; capMs?: number } = {},
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseMs = opts.baseMs ?? 400;
  const capMs = opts.capMs ?? 4000;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (err?.code === "ai_cap") throw err;
      const status: number | undefined =
        err?.status ?? err?.statusCode ?? err?.response?.status;
      const retryable =
        status === undefined || status === 429 || (status >= 500 && status < 600);
      if (!retryable || i === attempts - 1) throw err;
      const jitter = Math.random() * 100;
      const delay = Math.min(capMs, baseMs * 2 ** i) + jitter;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}