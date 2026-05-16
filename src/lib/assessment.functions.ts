import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway";
import { chargeAiUsage } from "./ai-guardrails";
import { enforceCooldown } from "./security";

const QUESTIONS_PER_ATTEMPT = 10;
const SECONDS_PER_QUESTION = 45;
const SUBMIT_GRACE_SECONDS = 10;
const RECENT_ATTEMPTS_LOOKBACK = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Server-side: create an attempt and return a sanitized question set.
 * `correct_answer` is NEVER sent to the client.
 */
export const startAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      assessmentId: z.string().uuid(),
      difficulty: z
        .enum(["easy", "medium", "hard", "mixed", "adaptive"])
        .default("adaptive"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Look up assessment
    const { data: def, error: defErr } = await supabase
      .from("assessment_definitions")
      .select("id, title, category, is_active")
      .eq("id", data.assessmentId)
      .single();
    if (defErr || !def) throw new Error("Assessment not found");
    if (!(def as any).is_active) throw new Error("Assessment is not active");

    // Pull pool from sanitized public view (no correct_answer / explanation)
    const { data: pool, error: qErr } = await supabase
      .from("questions_public" as any)
      .select("id, prompt, options, points, order_index, difficulty, topic")
      .eq("assessment_id", data.assessmentId);
    if (qErr) throw new Error(qErr.message);
    if (!pool || pool.length === 0) throw new Error("No questions available");

    // Anti-repeat: prefer questions the user has not seen recently.
    const { data: recentAtt } = await supabase
      .from("assessment_attempts")
      .select("id")
      .eq("user_id", userId)
      .eq("assessment_id", data.assessmentId)
      .order("started_at", { ascending: false })
      .limit(RECENT_ATTEMPTS_LOOKBACK);
    const recentIds = (recentAtt ?? []).map((r: any) => r.id as string);
    let seenIds = new Set<string>();
    if (recentIds.length) {
      const { data: seenRows } = await supabase
        .from("scores")
        .select("question_id")
        .in("attempt_id", recentIds);
      seenIds = new Set((seenRows ?? []).map((r: any) => r.question_id as string));
    }

    // Adaptive: derive a difficulty target from the last attempt's percentage.
    let effectiveDifficulty: "easy" | "medium" | "hard" | "mixed" = "mixed";
    if (data.difficulty === "adaptive") {
      const { data: last } = await supabase
        .from("assessment_attempts")
        .select("total_score, max_score, completed_at")
        .eq("user_id", userId)
        .eq("assessment_id", data.assessmentId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const lastPct = last && (last as any).max_score
        ? ((last as any).total_score / (last as any).max_score) * 100
        : 0;
      effectiveDifficulty = !last ? "medium" : lastPct >= 80 ? "hard" : lastPct < 50 ? "easy" : "medium";
    } else {
      effectiveDifficulty = data.difficulty as any;
    }

    const matchesDifficulty = (q: any) =>
      effectiveDifficulty === "mixed" ? true : q.difficulty === effectiveDifficulty;
    const target = Math.min(QUESTIONS_PER_ATTEMPT, pool.length);
    const inBand = (pool as any[]).filter(matchesDifficulty);
    const fallback = (pool as any[]).filter((q) => !matchesDifficulty(q));
    const orderByFreshness = (rows: any[]) => {
      const fresh = rows.filter((q) => !seenIds.has(q.id));
      const stale = rows.filter((q) => seenIds.has(q.id));
      return [...shuffle(fresh), ...shuffle(stale)];
    };
    const picked = [
      ...orderByFreshness(inBand),
      ...orderByFreshness(fallback),
    ].slice(0, target);
    const sanitized = picked.map((q: any) => ({
      id: q.id as string,
      prompt: q.prompt as string,
      options: shuffle(Array.isArray(q.options) ? q.options : []) as string[],
      points: (q.points as number) ?? 1,
      difficulty: (q.difficulty as "easy" | "medium" | "hard") ?? "medium",
      topic: (q.topic as string | null) ?? null,
    }));

    const maxScore = sanitized.reduce((s, q) => s + (q.points || 1), 0);
    const durationSeconds = sanitized.length * SECONDS_PER_QUESTION;
    const expiresAt = new Date(Date.now() + durationSeconds * 1000).toISOString();

    // Create attempt row (server-issued started_at)
    const { data: att, error: attErr } = await supabase
      .from("assessment_attempts")
      .insert({
        user_id: userId,
        assessment_id: data.assessmentId,
        max_score: maxScore,
        total_score: 0,
        expires_at: expiresAt,
        status: "in_progress",
        difficulty: data.difficulty,
      } as any)
      .select("id, started_at, expires_at")
      .single();
    if (attErr || !att) throw new Error(attErr?.message ?? "Could not start attempt");

    return {
      attemptId: (att as any).id as string,
      startedAt: (att as any).started_at as string,
      expiresAt: (att as any).expires_at as string,
      durationSeconds,
      difficulty: data.difficulty,
      effectiveDifficulty,
      assessment: {
        id: (def as any).id,
        title: (def as any).title,
        category: (def as any).category,
      },
      // question_id ordering preserved server-side too via questionIds list
      questionIds: sanitized.map((q) => q.id),
      questions: sanitized,
    };
  });

/**
 * Server-side scoring. Looks up correct answers, enforces server-issued timer,
 * and returns a review payload (now safe to include correct_answer).
 * Idempotent: re-submitting a completed attempt returns the original result.
 */
export const submitAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      attemptId: z.string().uuid(),
      answers: z
        .array(
          z.object({
            questionId: z.string().uuid(),
            selected: z.string().min(1).max(2000).nullable(),
          }),
        )
        .min(1)
        .max(50),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load attempt (RLS scopes to user)
    const { data: att, error: attErr } = await supabase
      .from("assessment_attempts")
      .select("id, user_id, assessment_id, started_at, expires_at, completed_at, max_score, total_score, status")
      .eq("id", data.attemptId)
      .single();
    if (attErr || !att) throw new Error("Attempt not found");
    if ((att as any).user_id !== userId) throw new Error("Forbidden");
    await enforceCooldown(supabase, "assessment_submit", 5);

    // Idempotent path: already completed → return saved review
    if ((att as any).completed_at) {
      return await buildReview(supabase, att as any);
    }

    // Server-issued expiry enforcement (with grace window).
    const expiresAtMs = new Date((att as any).expires_at).getTime();
    const expired = Date.now() > expiresAtMs + SUBMIT_GRACE_SECONDS * 1000;

    // Load the questions referenced by the submitted answers.
    // Public meta (assessment_id, points) via user-scoped client; secrets via service-role admin.
    const qIds = data.answers.map((a) => a.questionId);
    const [{ data: qs, error: qErr }, { data: secrets, error: sErr }] = await Promise.all([
      supabase
        .from("questions_public" as any)
        .select("id, assessment_id, points")
        .in("id", qIds),
      supabaseAdmin
        .from("question_secrets" as any)
        .select("question_id, correct_answer")
        .in("question_id", qIds),
    ]);
    if (qErr) throw new Error(qErr.message);
    if (sErr) throw new Error(sErr.message);
    const secretMap = new Map<string, string>(
      (secrets ?? []).map((s: any) => [s.question_id as string, s.correct_answer as string]),
    );
    const qMap = new Map<string, { correct_answer: string; points: number; assessment_id: string }>(
      (qs ?? []).map((q: any) => [
        q.id,
        {
          correct_answer: secretMap.get(q.id) ?? "",
          points: q.points ?? 1,
          assessment_id: q.assessment_id,
        },
      ]),
    );

    // Validate all questions belong to this attempt's assessment
    for (const a of data.answers) {
      const q = qMap.get(a.questionId);
      if (!q) throw new Error("Unknown question");
      if (q.assessment_id !== (att as any).assessment_id) throw new Error("Question/attempt mismatch");
    }

    // Grade what was actually submitted. If the attempt expired beyond the
    // grace window we still record the answers (auto-submit semantics) but
    // mark the attempt as "expired" so the UI can surface that.
    let earned = 0;
    let total = 0;
    const scoreRows = data.answers.map((a) => {
      const q = qMap.get(a.questionId)!;
      total += q.points;
      const isCorrect = a.selected != null && a.selected === q.correct_answer;
      if (isCorrect) earned += q.points;
      return {
        attempt_id: data.attemptId,
        question_id: a.questionId,
        user_id: userId,
        selected_answer: a.selected,
        is_correct: isCorrect,
        points_awarded: isCorrect ? q.points : 0,
      };
    });

    const { error: scErr } = await supabase.from("scores").insert(scoreRows as any);
    if (scErr) throw new Error(scErr.message);

    const { error: updErr } = await supabase
      .from("assessment_attempts")
      .update({
        total_score: earned,
        max_score: total,
        completed_at: new Date().toISOString(),
        status: expired ? "expired" : "submitted",
      } as any)
      .eq("id", data.attemptId);
    if (updErr) throw new Error(updErr.message);

    // Mirror to legacy `assessments` so existing dashboards keep working
    const { data: defRow } = await supabase
      .from("assessment_definitions")
      .select("title, category")
      .eq("id", (att as any).assessment_id)
      .single();
    const topic = defRow
      ? `${(defRow as any).category.toUpperCase()} – ${(defRow as any).title}`
      : "Assessment";
    await supabase.from("assessments").insert({
      user_id: userId,
      topic,
      score: earned,
      total,
      breakdown: scoreRows.map((r) => ({ question_id: r.question_id, correct: r.is_correct })),
    } as any);

    // Auto-add to skills if user cleared with ≥80%
    const pctScore = total > 0 ? Math.round((earned / total) * 100) : 0;
    if (pctScore >= 80 && defRow) {
      const skillName = String((defRow as any).category ?? "")
        .trim()
        .toUpperCase();
      if (skillName) {
        const { data: existing } = await supabase
          .from("skills")
          .select("level")
          .eq("user_id", userId)
          .eq("name", skillName)
          .maybeSingle();
        const newLevel = Math.max((existing as any)?.level ?? 0, pctScore);
        await supabase.from("skills").upsert(
          {
            user_id: userId,
            name: skillName,
            level: newLevel,
            source: "assessment",
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "user_id,name" },
        );
      }
    }

    return await buildReview(supabase, {
      ...(att as any),
      total_score: earned,
      max_score: total,
      completed_at: new Date().toISOString(),
    });
  });

async function buildReview(
  supabase: any,
  att: { id: string; assessment_id: string; total_score: number; max_score: number; completed_at: string },
) {
  const { data: rows } = await supabase
    .from("scores")
    .select("question_id, selected_answer, is_correct, points_awarded, questions:question_id(id, prompt, options, points, difficulty, topic)")
    .eq("attempt_id", att.id);

  const qIds = (rows ?? []).map((r: any) => r.question_id as string);
  const { data: secrets } = qIds.length
    ? await supabaseAdmin
        .from("question_secrets" as any)
        .select("question_id, correct_answer, explanation")
        .in("question_id", qIds)
    : { data: [] as any[] };
  const secretMap = new Map<string, { correct_answer: string; explanation: string | null }>(
    (secrets ?? []).map((s: any) => [
      s.question_id as string,
      { correct_answer: s.correct_answer as string, explanation: (s.explanation ?? null) as string | null },
    ]),
  );

  const review = (rows ?? []).map((r: any) => {
    const sec = secretMap.get(r.question_id as string);
    return {
      questionId: r.question_id as string,
      selected: r.selected_answer as string | null,
      isCorrect: !!r.is_correct,
      pointsAwarded: r.points_awarded ?? 0,
      prompt: r.questions?.prompt as string,
      options: (Array.isArray(r.questions?.options) ? r.questions.options : []) as string[],
      correctAnswer: sec?.correct_answer ?? "",
      explanation: sec?.explanation ?? null,
      difficulty: ((r.questions?.difficulty as string) ?? "medium") as "easy" | "medium" | "hard",
      topic: ((r.questions?.topic as string | null) ?? null),
      points: (r.questions?.points as number) ?? 1,
    };
  });

  // Topic-wise scoring
  const topicMap = new Map<string, { earned: number; total: number; correct: number; count: number }>();
  const diffMap = new Map<string, { earned: number; total: number; correct: number; count: number }>();
  for (const r of review) {
    const tk = r.topic && r.topic.trim() ? r.topic : "General";
    const tt = topicMap.get(tk) ?? { earned: 0, total: 0, correct: 0, count: 0 };
    tt.total += r.points;
    tt.earned += r.pointsAwarded;
    tt.count += 1;
    if (r.isCorrect) tt.correct += 1;
    topicMap.set(tk, tt);

    const dk = r.difficulty;
    const dd = diffMap.get(dk) ?? { earned: 0, total: 0, correct: 0, count: 0 };
    dd.total += r.points;
    dd.earned += r.pointsAwarded;
    dd.count += 1;
    if (r.isCorrect) dd.correct += 1;
    diffMap.set(dk, dd);
  }
  const topicBreakdown = Array.from(topicMap.entries()).map(([topic, v]) => ({
    topic,
    ...v,
    pct: v.total ? Math.round((v.earned / v.total) * 100) : 0,
  }));
  const difficultyBreakdown = Array.from(diffMap.entries()).map(([difficulty, v]) => ({
    difficulty,
    ...v,
    pct: v.total ? Math.round((v.earned / v.total) * 100) : 0,
  }));

  return {
    attemptId: att.id,
    score: att.total_score,
    total: att.max_score,
    completedAt: att.completed_at,
    review,
    topicBreakdown,
    difficultyBreakdown,
  };
}

export const generateAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      topic: z.enum(["sql", "python", "analytics", "statistics", "excel"]),
      count: z.number().min(3).max(10).default(5),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    // Enforce per-user daily AI cap.
    await enforceCooldown(supabase, "assessment_gen", 30);
    await chargeAiUsage(supabase, userId, "assessment_gen");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway(DEFAULT_MODEL);

    const schema = z.object({
      questions: z.array(z.object({
        id: z.string(),
        question: z.string(),
        options: z.array(z.string()).length(4),
        answer_index: z.number().min(0).max(3),
        explanation: z.string(),
      })).min(3).max(10),
    });

    const { output } = await generateText({
      model,
      output: Output.object({ schema }),
      prompt: `Generate exactly ${data.count} multiple-choice questions on "${data.topic}" for a job-readiness assessment. Mix difficulty: 2 easy, 2 medium, rest hard. Each question has 4 options and exactly one correct answer_index. Use realistic interview-style questions.`,
    });

    return { questions: output.questions };
  });
