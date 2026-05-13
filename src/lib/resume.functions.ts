import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway";

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      text: z.string().min(50).max(50000),
      targetRole: z.string().min(1).max(120).default("Software Engineer"),
      resumeId: z.string().uuid().optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway(DEFAULT_MODEL);

    const schema = z.object({
      ats_score: z.number().min(0).max(100),
      summary: z.string(),
      strengths: z.array(z.string()).max(8),
      gaps: z.array(z.string()).max(8),
      keywords: z.array(z.string()).max(20),
      suggestions: z.array(z.string()).max(8),
      detected_skills: z.array(z.object({ name: z.string(), level: z.number().min(0).max(100) })).max(20),
    });

    const { output } = await generateText({
      model,
      output: Output.object({ schema }),
      prompt: `You are an expert ATS resume analyzer. Analyze the resume against the target role "${data.targetRole}".\n\nReturn a strict ATS score (0-100), a 1-2 sentence summary, key strengths, missing gaps, top keywords found, concrete suggestions, and detected skills with proficiency levels (0-100).\n\nRESUME:\n${data.text}`,
    });

    const { supabase, userId } = context;

    const { data: analysis, error } = await supabase
      .from("resume_analyses")
      .insert({
        user_id: userId,
        resume_id: data.resumeId ?? null,
        ats_score: output.ats_score,
        summary: output.summary,
        strengths: output.strengths,
        gaps: output.gaps,
        keywords: output.keywords,
        suggestions: output.suggestions,
      } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // upsert skills
    if (output.detected_skills.length > 0) {
      for (const s of output.detected_skills) {
        await supabase.from("skills").insert({
          user_id: userId,
          name: s.name,
          level: s.level,
          source: "resume",
        } as any);
      }
    }

    return { analysis, detected_skills: output.detected_skills };
  });