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

// ---------------------------------------------------------------------------
// Keyword-based resume analyzer (deterministic, no AI required).
// Architecture is intentionally pluggable so an OpenAI / Lovable AI step
// can be layered on top later without changing the call sites.
// ---------------------------------------------------------------------------

type SkillRule = {
  name: string;
  patterns: RegExp[];
  category: "language" | "bi" | "tool" | "section";
};

const SKILL_RULES: SkillRule[] = [
  { name: "SQL", category: "language", patterns: [/\bsql\b/i, /\bmysql\b/i, /\bpostgres(ql)?\b/i, /\btsql\b/i, /\bplsql\b/i] },
  { name: "Python", category: "language", patterns: [/\bpython\b/i, /\bpandas\b/i, /\bnumpy\b/i, /\bscikit[- ]learn\b/i] },
  { name: "Power BI", category: "bi", patterns: [/\bpower\s*bi\b/i, /\bdax\b/i, /\bpower\s*query\b/i] },
  { name: "Tableau", category: "bi", patterns: [/\btableau\b/i] },
  { name: "Excel", category: "tool", patterns: [/\bexcel\b/i, /\bvlookup\b/i, /\bpivot\s*table/i] },
  { name: "Projects", category: "section", patterns: [/\bprojects?\b/i, /\bcase stud(y|ies)\b/i] },
  { name: "Certifications", category: "section", patterns: [/\bcertificat(e|ion)s?\b/i, /\bcredential(s)?\b/i] },
];

const SCORE_RULES: { match: (found: Set<string>) => boolean; points: number; reason: string }[] = [
  { match: (f) => f.has("SQL"), points: 20, reason: "SQL skills detected" },
  { match: (f) => f.has("Python"), points: 20, reason: "Python skills detected" },
  { match: (f) => f.has("Projects"), points: 20, reason: "Projects section included" },
  { match: (f) => f.has("Power BI") || f.has("Tableau"), points: 20, reason: "BI tools (Power BI / Tableau) included" },
  { match: (f) => f.has("Certifications"), points: 20, reason: "Certifications listed" },
];

const SUGGESTIONS: Record<string, string> = {
  SQL: "Add SQL — mention queries, joins, or window functions on real datasets.",
  Python: "Add Python — list libraries (pandas, numpy) and a small data project.",
  "Power BI": "Add a Power BI dashboard project (DAX measures, Power Query).",
  Tableau: "Add a Tableau dashboard with a clear business insight.",
  Excel: "Mention Excel skills (pivot tables, VLOOKUP, dashboards).",
  Projects: "Add a Projects section with 2–3 measurable outcomes.",
  Certifications: "List relevant certifications (Google Data Analytics, Microsoft PL-300, etc.).",
};

export const analyzeResumeKeywords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      text: z.string().min(20).max(100000),
      targetRole: z.string().min(1).max(120).default("Data Analyst"),
      resumeId: z.string().uuid().optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const found = new Set<string>();
    for (const rule of SKILL_RULES) {
      if (rule.patterns.some((p) => p.test(data.text))) found.add(rule.name);
    }

    let score = 0;
    const breakdown: { reason: string; points: number }[] = [];
    for (const rule of SCORE_RULES) {
      if (rule.match(found)) {
        score += rule.points;
        breakdown.push({ reason: rule.reason, points: rule.points });
      }
    }
    score = Math.min(100, score);

    const detectedSkills = Array.from(found);
    const missingSkills = SKILL_RULES.map((r) => r.name).filter((n) => !found.has(n));
    const suggestions = missingSkills.map((m) => SUGGESTIONS[m]).filter(Boolean);
    const strengths = detectedSkills.map((s) => `${s} found in resume`);
    const summary = `Resume scored ${score}/100 for ${data.targetRole}. ${detectedSkills.length} of ${SKILL_RULES.length} target areas detected.`;

    const { data: analysis, error } = await supabase
      .from("resume_analyses")
      .insert({
        user_id: userId,
        resume_id: data.resumeId ?? null,
        ats_score: score,
        summary,
        strengths,
        gaps: missingSkills,
        keywords: detectedSkills,
        suggestions,
      } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // upsert detected skills (level 70 baseline from keyword detection)
    for (const name of detectedSkills) {
      await supabase.from("skills").insert({
        user_id: userId,
        name,
        level: 70,
        source: "resume-keywords",
      } as any);
    }

    return {
      analysis,
      score,
      breakdown,
      detected_skills: detectedSkills,
      missing_skills: missingSkills,
      suggestions,
    };
  });

export const registerResumeUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      filePath: z.string().min(1).max(500),
      originalName: z.string().min(1).max(255),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        file_path: data.filePath,
        original_name: data.originalName,
      } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { resume: row };
  });