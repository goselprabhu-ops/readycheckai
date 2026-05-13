import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway";

export const generateAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      topic: z.enum(["sql", "python", "analytics", "statistics", "excel"]),
      count: z.number().min(3).max(10).default(5),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");
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

export const submitAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      topic: z.string().min(1).max(60),
      results: z.array(z.object({
        question: z.string(),
        correct: z.boolean(),
      })).min(1).max(20),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const total = data.results.length;
    const score = data.results.filter((r) => r.correct).length;

    const { data: row, error } = await supabase.from("assessments").insert({
      user_id: userId,
      topic: data.topic,
      score,
      total,
      breakdown: data.results,
    } as any).select().single();
    if (error) throw new Error(error.message);

    // upsert skill snapshot
    const level = Math.round((score / total) * 100);
    await supabase.from("skills").insert({
      user_id: userId,
      name: data.topic,
      level,
      source: "assessment",
    } as any);

    return { assessment: row, level };
  });