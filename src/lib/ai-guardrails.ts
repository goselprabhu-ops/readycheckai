// Per-user daily AI cost guardrails.
// Soft caps emit a warning client-side; hard caps reject with code 'ai_cap'.

export type AiFeature = "resume_ai" | "interview" | "assessment_gen";

export const AI_CAPS: Record<AiFeature, { soft: number; hard: number }> = {
  resume_ai: { soft: 5, hard: 10 },
  interview: { soft: 30, hard: 60 },
  assessment_gen: { soft: 10, hard: 20 },
};

export class AiCapError extends Error {
  code = "ai_cap" as const;
  constructor(public feature: AiFeature, public count: number, public hard: number) {
    super(`Daily AI limit reached for ${feature} (${count}/${hard}).`);
  }
}

/**
 * Increment usage counter atomically. Throws AiCapError when the hard cap
 * is exceeded. Returns { count, soft, hard }.
 */
export async function chargeAiUsage(
  supabase: any,
  userId: string,
  feature: AiFeature,
): Promise<{ count: number; soft: number; hard: number }> {
  const { soft, hard } = AI_CAPS[feature];
  const { data, error } = await supabase.rpc("increment_ai_usage", {
    _user_id: userId,
    _feature: feature,
    _hard_cap: hard,
  });
  if (error) {
    if (
      error.message?.includes("ai_usage_limit_exceeded") ||
      error.code === "23514"
    ) {
      throw new AiCapError(feature, hard + 1, hard);
    }
    throw new Error(error.message);
  }
  return { count: Number(data) || 0, soft, hard };
}
