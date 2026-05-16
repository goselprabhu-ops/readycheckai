import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { withRetry } from "@/lib/ai-gateway";
import { generateText, generateObject } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway";
import { withAiCache } from "./ai-cache.server";
import { chargeAiUsage } from "./ai-guardrails";
import { enforceCooldown } from "./security";

export const startInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ roleTarget: z.string().min(1).max(120) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("interview_sessions")
      .insert({ user_id: userId, role_target: data.roleTarget } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const opening = `Hi! I'm your AI interviewer for the ${data.roleTarget} role. Let's start with a warm-up: tell me about a project you're proud of and your specific contribution.`;
    await supabase.from("interview_messages").insert({
      session_id: row.id,
      user_id: userId,
      role: "assistant",
      content: opening,
    } as any);
    return { sessionId: row.id, opening };
  });

export const interviewTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      sessionId: z.string().uuid(),
      userMessage: z.string().min(1).max(4000),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: session } = await supabase
      .from("interview_sessions")
      .select("role_target")
      .eq("id", data.sessionId)
      .single();

    // Enforce per-user daily cap before spending AI tokens.
    await enforceCooldown(supabase, "interview_message", 2);
    await chargeAiUsage(supabase, userId, "interview");

    const { data: history } = await supabase
      .from("interview_messages")
      .select("role, content")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true });

    await supabase.from("interview_messages").insert({
      session_id: data.sessionId,
      user_id: userId,
      role: "user",
      content: data.userMessage,
    } as any);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway(DEFAULT_MODEL);

    const messages = [
      ...(history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: data.userMessage },
    ];

    const { text } = await withRetry(() => generateText({
      model,
      system: `You are a professional, friendly interviewer for the role "${session?.role_target ?? "Software Engineer"}". Ask one question at a time. Probe for specifics (STAR format). Keep replies under 80 words. After 6 exchanges, give brief feedback and end.`,
      messages,
    }));

    await supabase.from("interview_messages").insert({
      session_id: data.sessionId,
      user_id: userId,
      role: "assistant",
      content: text,
    } as any);

    return { reply: text };
  });

// ============================================================
// v1 — Structured, scored mock interview
// ============================================================

export const INTERVIEW_CATEGORIES = [
  { key: "sql", label: "SQL", kind: "technical" },
  { key: "python", label: "Python", kind: "technical" },
  { key: "power_bi", label: "Power BI", kind: "technical" },
  { key: "statistics", label: "Statistics", kind: "technical" },
  { key: "case_study", label: "Analytics Case Study", kind: "technical" },
  { key: "behavioral", label: "Behavioral", kind: "behavioral" },
  { key: "mixed", label: "Mixed (full loop)", kind: "mixed" },
] as const;

const CategoryEnum = z.enum([
  "sql", "python", "power_bi", "statistics", "case_study", "behavioral", "mixed",
]);
const DifficultyEnum = z.enum(["easy", "standard", "hard"]);

const PlanQuestionSchema = z.object({
  key: z.string(),
  type: z.enum(["mcq", "coding", "analytical", "dashboard", "behavioral"]),
  category: CategoryEnum,
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  expected_topics: z.array(z.string()).default([]),
  time_seconds: z.number().int().min(30).max(900).default(180),
});
const PlanSchema = z.object({ questions: z.array(PlanQuestionSchema).min(3).max(8) });

function categoryLabel(c: string) {
  return INTERVIEW_CATEGORIES.find((x) => x.key === c)?.label ?? c;
}

function getGateway() {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI gateway not configured");
  return createLovableAiGatewayProvider(apiKey)(DEFAULT_MODEL);
}

export const createInterviewV1 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      category: CategoryEnum,
      roleTarget: z.string().min(1).max(120),
      difficulty: DifficultyEnum.default("standard"),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await enforceCooldown(supabase, "interview_create", 5);
    await chargeAiUsage(supabase, userId, "interview");

    const model = getGateway();
    const count = data.category === "mixed" ? 6 : 5;
    const object = await withAiCache(
      {
        feature: "interview_plan",
        model: DEFAULT_MODEL,
        prompt: {
          category: data.category,
          role: data.roleTarget,
          difficulty: data.difficulty,
          count,
        },
        ttlSeconds: 60 * 60 * 24 * 7,
      },
      async () => {
        const r = await withRetry(() => generateObject({
          model,
          schema: PlanSchema,
          system: `You are a senior analytics hiring manager designing a realistic mock interview for the role "${data.roleTarget}". Produce ${count} interview questions covering the requested category at "${data.difficulty}" difficulty. For "mixed", include a balanced loop across SQL, Python, Power BI, statistics, a case study, and one behavioral. Each question must be answerable in 1-4 minutes by the candidate via text. For MCQs, include 4 plausible options. For coding, ask for an SQL/Python snippet. For dashboard questions, describe a chart in words and ask for interpretation. Avoid trivia.`,
          prompt: `Category: ${categoryLabel(data.category)}\nRole: ${data.roleTarget}\nDifficulty: ${data.difficulty}\nReturn a structured JSON plan.`,
        }));
        return r.object;
      },
    );

    // Stamp stable keys + default times
    const plan = object.questions.map((q, i) => ({
      ...q,
      key: q.key || `q${i + 1}`,
      time_seconds: q.time_seconds ?? 180,
    }));

    const totalSec = plan.reduce((s, q) => s + q.time_seconds, 0);
    const { data: row, error } = await supabase
      .from("interview_sessions")
      .insert({
        user_id: userId,
        role_target: data.roleTarget,
        category: data.category,
        difficulty: data.difficulty,
        duration_target_seconds: totalSec,
        status: "in_progress",
        plan,
        current_index: 0,
        evaluations: [],
      } as any)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Seed first question as assistant message for transcript continuity
    await supabase.from("interview_messages").insert({
      session_id: row.id,
      user_id: userId,
      role: "assistant",
      content: plan[0].prompt,
      question_key: plan[0].key,
      question_type: plan[0].type,
    } as any);

    return { sessionId: row.id, plan, totalDurationSec: totalSec };
  });

const EvalSchema = z.object({
  correctness: z.number().int().min(0).max(100),
  clarity: z.number().int().min(0).max(100),
  structure: z.number().int().min(0).max(100),
  confidence: z.number().int().min(0).max(100),
  communication: z.number().int().min(0).max(100),
  strengths: z.array(z.string()).max(5),
  improvements: z.array(z.string()).max(5),
  ideal_answer: z.string().max(1200),
});

export const submitInterviewAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      sessionId: z.string().uuid(),
      answer: z.string().min(1).max(6000),
      timeMs: z.number().int().min(0).max(60 * 60 * 1000).optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: session, error: sErr } = await supabase
      .from("interview_sessions")
      .select("id, role_target, category, plan, current_index, evaluations, status")
      .eq("id", data.sessionId)
      .single();
    if (sErr || !session) throw new Error("Session not found");
    if ((session as any).status !== "in_progress") throw new Error("Session is already complete");

    const plan = ((session as any).plan ?? []) as z.infer<typeof PlanQuestionSchema>[];
    const idx = (session as any).current_index as number;
    const current = plan[idx];
    if (!current) throw new Error("No active question");

    await enforceCooldown(supabase, "interview_answer", 2);
    await chargeAiUsage(supabase, userId, "interview");

    const model = getGateway();
    const { object: evaluation } = await withRetry(() => generateObject({
      model,
      schema: EvalSchema,
      system: `You are an expert analytics interviewer evaluating a candidate's spoken-in-text answer. Be fair and grounded. Score 0–100 across the rubric. "confidence" infers from hedging language, decisiveness, and ownership words. "communication" reflects clarity + structure for a non-technical listener.`,
      prompt: `Role: ${(session as any).role_target}\nCategory: ${categoryLabel((session as any).category)}\nQuestion type: ${current.type}\nQuestion: ${current.prompt}${current.options?.length ? `\nOptions: ${current.options.join(" | ")}` : ""}\nExpected topics: ${current.expected_topics.join(", ") || "n/a"}\n\nCandidate answer:\n${data.answer}`,
    }));

    // Persist user message + evaluation
    await supabase.from("interview_messages").insert({
      session_id: data.sessionId,
      user_id: userId,
      role: "user",
      content: data.answer,
      question_key: current.key,
      question_type: current.type,
      evaluation: evaluation as any,
      score: Math.round(
        (evaluation.correctness + evaluation.clarity + evaluation.structure) / 3,
      ),
    } as any);

    const newEvals = [
      ...((session as any).evaluations ?? []),
      { key: current.key, type: current.type, category: current.category, ...evaluation, timeMs: data.timeMs ?? null },
    ];
    const nextIdx = idx + 1;
    const done = nextIdx >= plan.length;

    let nextQuestion = null as null | (typeof plan)[number];
    if (!done) {
      nextQuestion = plan[nextIdx];
      await supabase.from("interview_messages").insert({
        session_id: data.sessionId,
        user_id: userId,
        role: "assistant",
        content: nextQuestion.prompt,
        question_key: nextQuestion.key,
        question_type: nextQuestion.type,
      } as any);
    }

    await supabase
      .from("interview_sessions")
      .update({
        evaluations: newEvals as any,
        current_index: nextIdx,
      } as any)
      .eq("id", data.sessionId);

    return { evaluation, done, nextQuestion, progress: { index: nextIdx, total: plan.length } };
  });

const FinalFeedbackSchema = z.object({
  summary: z.string().max(800),
  strengths: z.array(z.string()).max(6),
  improvements: z.array(z.string()).max(6),
  next_steps: z.array(z.string()).max(6),
});

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export const finalizeInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: session, error } = await supabase
      .from("interview_sessions")
      .select("id, role_target, category, plan, evaluations, started_at, status")
      .eq("id", data.sessionId)
      .single();
    if (error || !session) throw new Error("Session not found");
    if ((session as any).status === "completed") {
      return { alreadyComplete: true };
    }

    const evals = ((session as any).evaluations ?? []) as Array<
      z.infer<typeof EvalSchema> & { type: string; category: string }
    >;

    const technical = avg(
      evals.filter((e) => e.type !== "behavioral").map((e) => Math.round((e.correctness + e.structure) / 2)),
    );
    const communication = avg(evals.map((e) => Math.round((e.clarity + e.communication) / 2)));
    const confidence = avg(evals.map((e) => e.confidence));
    const overall = Math.round(technical * 0.5 + communication * 0.3 + confidence * 0.2);

    let feedback: z.infer<typeof FinalFeedbackSchema> = {
      summary: "Interview complete.",
      strengths: [],
      improvements: [],
      next_steps: [],
    };
    try {
      await chargeAiUsage(supabase, userId, "interview");
      const model = getGateway();
      const { object } = await withRetry(() => generateObject({
        model,
        schema: FinalFeedbackSchema,
        system: "You are an analytics career coach summarizing a mock interview. Be specific, actionable, and kind. Reference concrete patterns visible in per-question scores.",
        prompt: `Role: ${(session as any).role_target}\nCategory: ${categoryLabel((session as any).category)}\nPer-question evaluations (JSON):\n${JSON.stringify(evals, null, 2)}\nAggregate — technical:${technical} communication:${communication} confidence:${confidence} overall:${overall}.`,
      }));
      feedback = object;
    } catch (e) {
      // Non-fatal — keep numeric scores even if summary fails.
    }

    await supabase
      .from("interview_sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        technical_score: technical,
        communication_score: communication,
        confidence_score: confidence,
        overall_score: overall,
        feedback: feedback as any,
      } as any)
      .eq("id", data.sessionId);

    return {
      scores: { technical, communication, confidence, overall },
      feedback,
      alreadyComplete: false,
    };
  });

export const listInterviewSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("interview_sessions")
      .select(
        "id, created_at, ended_at, role_target, category, difficulty, status, technical_score, communication_score, confidence_score, overall_score",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { sessions: data ?? [] };
  });

export const getInterviewReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("interview_sessions")
      .select("category, technical_score, communication_score, confidence_score, overall_score, created_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const overall = avg(rows.map((r: any) => r.overall_score ?? 0).filter(Boolean));
    const technical = avg(rows.map((r: any) => r.technical_score ?? 0).filter(Boolean));
    const communication = avg(rows.map((r: any) => r.communication_score ?? 0).filter(Boolean));
    const confidence = avg(rows.map((r: any) => r.confidence_score ?? 0).filter(Boolean));
    const byCategory: Record<string, { count: number; overall: number }> = {};
    for (const r of rows as any[]) {
      const k = r.category ?? "mixed";
      const cur = byCategory[k] ?? { count: 0, overall: 0 };
      cur.count += 1;
      cur.overall += r.overall_score ?? 0;
      byCategory[k] = cur;
    }
    const categories = Object.entries(byCategory).map(([key, v]) => ({
      key,
      label: categoryLabel(key),
      count: v.count,
      overall: v.count ? Math.round(v.overall / v.count) : 0,
    }));
    return {
      totals: { overall, technical, communication, confidence, sessions: rows.length },
      categories,
      trend: rows
        .slice()
        .reverse()
        .map((r: any) => ({ at: r.created_at, overall: r.overall_score ?? 0 })),
    };
  });