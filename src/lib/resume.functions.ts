import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { withRetry } from "@/lib/ai-gateway";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway";
import { withAiCache } from "./ai-cache.server";
import { extractPdf, type ParserStatus } from "./pdf-extract";
import { chargeAiUsage, AiCapError } from "./ai-guardrails";
import { enforceCooldown } from "./security";
import { ocrPdfViaGateway } from "./resume-ocr";
import { logEvent } from "./observability";
import {
  decideAnalyzer,
  PARSER_STATUS_MESSAGES,
  type ResumeAnalysisMethod,
} from "./resume-pipeline";

/**
 * Idempotent skill upsert: if a row already exists for (user_id, name),
 * keep the highest level. Backed by the unique index on (user_id, name).
 */
async function upsertSkills(
  supabase: any,
  userId: string,
  source: string,
  rows: { name: string; level: number }[],
) {
  if (rows.length === 0) return;
  const names = Array.from(new Set(rows.map((r) => r.name.trim()).filter(Boolean)));
  if (names.length === 0) return;

  const { data: existing } = await supabase
    .from("skills")
    .select("name, level")
    .eq("user_id", userId)
    .in("name", names);
  const existingMap = new Map<string, number>(
    (existing ?? []).map((r: any) => [r.name as string, r.level as number]),
  );

  const merged = names.map((name) => {
    const incoming = rows
      .filter((r) => r.name.trim() === name)
      .reduce((m, r) => Math.max(m, r.level), 0);
    const prev = existingMap.get(name) ?? 0;
    return {
      user_id: userId,
      name,
      level: Math.max(prev, incoming),
      source,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase
    .from("skills")
    .upsert(merged, { onConflict: "user_id,name" });
  if (error) throw new Error(error.message);
}

const analyzeResumeInputSchema = z.object({
      text: z.string().min(50).max(50000),
      targetRole: z.string().min(1).max(120).default("Software Engineer"),
      resumeId: z.string().uuid().optional(),
      extractionConfidence: z.number().min(0).max(1).optional(),
      parserStatus: z.string().max(40).optional(),
    });

type AnalyzeResumeInput = z.infer<typeof analyzeResumeInputSchema>;

async function analyzeResumeInternal(
  supabase: any,
  userId: string,
  data: AnalyzeResumeInput,
) {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    // Cost guardrail — atomic increment + hard cap check.
    await chargeAiUsage(supabase, userId, "resume_ai");

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
      parsed_fields: z.object({
        name: z.string().optional().default(""),
        email: z.string().optional().default(""),
        phone: z.string().optional().default(""),
        education: z.array(z.object({
          degree: z.string().optional().default(""),
          institution: z.string().optional().default(""),
          year: z.string().optional().default(""),
        })).max(8).optional().default([]),
        experience: z.array(z.object({
          title: z.string().optional().default(""),
          company: z.string().optional().default(""),
          duration: z.string().optional().default(""),
          highlights: z.array(z.string()).max(6).optional().default([]),
        })).max(8).optional().default([]),
        projects: z.array(z.object({
          name: z.string().optional().default(""),
          description: z.string().optional().default(""),
          tech: z.array(z.string()).max(10).optional().default([]),
        })).max(8).optional().default([]),
        certifications: z.array(z.string()).max(12).optional().default([]),
      }).optional().default({}),
      role_matches: z.object({
        data_analyst: z.number().min(0).max(100),
        bi_analyst: z.number().min(0).max(100),
        business_analyst: z.number().min(0).max(100),
      }),
      ats_breakdown: z.object({
        formatting: z.number().min(0).max(100),
        readability: z.number().min(0).max(100),
        keyword_optimization: z.number().min(0).max(100),
        section_structure: z.number().min(0).max(100),
      }),
      quality_breakdown: z.object({
        impact_statements: z.number().min(0).max(100),
        quantified_achievements: z.number().min(0).max(100),
        action_verbs: z.number().min(0).max(100),
        project_descriptions: z.number().min(0).max(100),
      }),
      rewrites: z.object({
        summary: z.string().optional().default(""),
        bullets: z.array(z.object({
          original: z.string(),
          improved: z.string(),
        })).max(6).optional().default([]),
        projects: z.array(z.object({
          original: z.string(),
          improved: z.string(),
        })).max(4).optional().default([]),
      }).optional().default({}),
    });

    const prompt = `You are a recruiter-grade ATS resume analyzer for analytics careers.

Target role: "${data.targetRole}".

Tasks:
1. Strict ATS score 0-100 plus 1-2 sentence summary.
2. Key strengths, gaps, top keywords, concrete suggestions.
3. Detected skills with proficiency 0-100. Use semantic understanding — infer SQL, Power BI, Tableau, dashboards, analytics, business communication even if exact keywords are missing.
4. parsed_fields: extract name, email, phone, education[], experience[], projects[], certifications[].
5. role_matches: % fit (0-100) for Data Analyst, BI Analyst, Business Analyst.
6. ats_breakdown: 0-100 each for formatting, readability, keyword_optimization, section_structure.
7. quality_breakdown: 0-100 each for impact_statements, quantified_achievements, action_verbs, project_descriptions.
8. rewrites: an improved summary, up to 6 bullet rewrites (original + improved with quantified impact and strong verbs), up to 4 project description rewrites.

RESUME:
${data.text}`;

    // Cache by (text, targetRole) — same resume + role re-analysis is a free hit.
    const output = await withAiCache(
      {
        feature: "resume_analyze",
        model: DEFAULT_MODEL,
        prompt: { text: data.text, role: data.targetRole },
        ttlSeconds: 60 * 60 * 24 * 7,
      },
      async () => {
        const res = await withRetry(() => generateText({
          model,
          output: Output.object({ schema }),
          prompt,
        }));
        return res.output;
      },
    );

    const analysis = await persistCanonicalAnalysis(supabase, {
      user_id: userId,
      resume_id: data.resumeId ?? null,
      ats_score: output.ats_score,
      summary: output.summary,
      strengths: output.strengths,
      gaps: output.gaps,
      keywords: output.keywords,
      suggestions: output.suggestions,
      method: "ai",
      extraction_confidence: data.extractionConfidence ?? null,
      parser_status: (data.parserStatus as ParserStatus | undefined) ?? "ok",
      extraction_error: null,
      parsed_fields: output.parsed_fields ?? {},
      role_matches: output.role_matches,
      ats_breakdown: output.ats_breakdown,
      quality_breakdown: output.quality_breakdown,
      rewrites: output.rewrites ?? {},
    });

    // upsert skills (greatest-level semantics, deduped)
    await upsertSkills(supabase, userId, "resume", output.detected_skills);

    return {
      analysis,
      detected_skills: output.detected_skills,
      parsed_fields: output.parsed_fields,
      role_matches: output.role_matches,
      ats_breakdown: output.ats_breakdown,
      quality_breakdown: output.quality_breakdown,
      rewrites: output.rewrites,
    };
}

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => analyzeResumeInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    return analyzeResumeInternal(context.supabase, context.userId, data);
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

const analyzeResumeKeywordsInputSchema = z.object({
      text: z.string().min(20).max(100000),
      targetRole: z.string().min(1).max(120).default("Data Analyst"),
      resumeId: z.string().uuid().optional(),
      extractionConfidence: z.number().min(0).max(1).optional(),
      parserStatus: z.string().max(40).optional(),
      method: z.enum(["keyword", "fallback"]).default("keyword"),
    });

type AnalyzeResumeKeywordsInput = z.infer<typeof analyzeResumeKeywordsInputSchema>;

async function analyzeResumeKeywordsInternal(
  supabase: any,
  userId: string,
  data: AnalyzeResumeKeywordsInput,
) {

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

    const analysis = await persistCanonicalAnalysis(supabase, {
      user_id: userId,
      resume_id: data.resumeId ?? null,
      ats_score: score,
      summary,
      strengths,
      gaps: missingSkills,
      keywords: detectedSkills,
      suggestions,
      method: data.method,
      extraction_confidence: data.extractionConfidence ?? null,
      parser_status: (data.parserStatus as ParserStatus | undefined) ?? "ok",
      extraction_error: null,
    });

    // upsert detected skills (level 70 baseline from keyword detection)
    await upsertSkills(
      supabase,
      userId,
      "resume-keywords",
      detectedSkills.map((name) => ({ name, level: 70 })),
    );

    return {
      analysis,
      score,
      breakdown,
      detected_skills: detectedSkills,
      missing_skills: missingSkills,
      suggestions,
    };
}

export const analyzeResumeKeywords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => analyzeResumeKeywordsInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    return analyzeResumeKeywordsInternal(context.supabase, context.userId, data);
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

// ---------------------------------------------------------------------------
// Unified analyzer — tries AI first, falls back to deterministic keyword
// rules on AI failure (rate-limit, gateway error, parsing error). Caps
// apply only when AI actually runs.
// ---------------------------------------------------------------------------
export const analyzeResumeAuto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      text: z.string().min(20).max(100000),
      targetRole: z.string().min(1).max(120).default("Data Analyst"),
      resumeId: z.string().uuid().optional(),
      extractionConfidence: z.number().min(0).max(1).optional(),
      parserStatus: z.string().max(40).optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    // Try AI path first; fall back to deterministic keyword analyzer on
    // any non-cap error. Cap errors are surfaced verbatim.
    try {
      const ai = await analyzeResumeInternal(context.supabase, context.userId, data);
      return { mode: "ai" as const, ...ai };
    } catch (e: any) {
      if (e instanceof AiCapError) throw e;
      const kw = await analyzeResumeKeywordsInternal(context.supabase, context.userId, {
        ...data,
        method: "fallback",
      });
      return { mode: "fallback" as const, ...kw };
    }
  });

// ---------------------------------------------------------------------------
// Server-side PDF extraction. Accepts a storage object path (already
// uploaded to the `resumes` bucket) and returns the extracted text. This
// removes ~1.5 MB of pdfjs from the browser bundle.
// ---------------------------------------------------------------------------
export const extractResumeText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ filePath: z.string().min(1).max(500) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: blob, error } = await supabase.storage
      .from("resumes")
      .download(data.filePath);
    if (error || !blob) {
      return {
        text: "",
        status: "malformed_pdf" as ParserStatus,
        confidence: 0,
        pageCount: 0,
        error: error?.message ?? "Could not download PDF",
        message: PARSER_STATUS_MESSAGES.malformed_pdf,
      };
    }
    const buf = new Uint8Array(await blob.arrayBuffer());
    const result = await extractPdf(buf);
    return {
      ...result,
      message: PARSER_STATUS_MESSAGES[result.status],
    };
  });

// ---------------------------------------------------------------------------
// Canonical persist: one record per resume_id, latest analysis wins.
// ---------------------------------------------------------------------------
async function persistCanonicalAnalysis(
  supabase: any,
  row: {
    user_id: string;
    resume_id: string | null;
    ats_score: number;
    summary: string;
    strengths: string[];
    gaps: string[];
    keywords: string[];
    suggestions: string[];
    method: ResumeAnalysisMethod;
    extraction_confidence: number | null;
    parser_status: ParserStatus | null;
    extraction_error: string | null;
    parsed_fields?: any;
    role_matches?: any;
    ats_breakdown?: any;
    quality_breakdown?: any;
    rewrites?: any;
  },
) {
  if (row.resume_id) {
    const { data, error } = await supabase
      .from("resume_analyses")
      .upsert(row as any, { onConflict: "resume_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
  const { data, error } = await supabase
    .from("resume_analyses")
    .insert(row as any)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// One-shot pipeline endpoint — extract → decide → analyze → persist.
// Frontend calls a single fn and receives status updates via stages.
// ---------------------------------------------------------------------------
export const runResumePipeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      filePath: z.string().min(1).max(500),
      resumeId: z.string().uuid(),
      targetRole: z.string().min(1).max(120).default("Data Analyst"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    await enforceCooldown(supabase, "resume_analysis", 30);

    // 1. Download + extract
    const { data: blob, error: dlErr } = await supabase.storage
      .from("resumes")
      .download(data.filePath);
    if (dlErr || !blob) {
      const errMsg = dlErr?.message ?? "Could not download PDF";
      await persistCanonicalAnalysis(supabase, {
        user_id: userId,
        resume_id: data.resumeId,
        ats_score: 0, summary: errMsg, strengths: [], gaps: [], keywords: [], suggestions: [],
        method: "fallback",
        extraction_confidence: 0,
        parser_status: "malformed_pdf",
        extraction_error: errMsg,
      });
      return {
        ok: false as const,
        stage: "extract" as const,
        status: "malformed_pdf" as ParserStatus,
        message: PARSER_STATUS_MESSAGES.malformed_pdf,
        error: errMsg,
      };
    }
    const buf = new Uint8Array(await blob.arrayBuffer());
    let ext = await extractPdf(buf);
    let usedOcr = false;

    // OCR fallback for scanned / image-only PDFs.
    if (
      ext.status === "image_only_pdf" &&
      process.env.LOVABLE_API_KEY
    ) {
      const t0 = Date.now();
      const ocr = await ocrPdfViaGateway(buf, process.env.LOVABLE_API_KEY);
      await logEvent({
        eventType: "resume_ocr",
        severity: ocr.ok ? "info" : "warn",
        source: "resume-pipeline",
        message: ocr.ok ? "ocr_success" : ocr.error ?? "ocr_failed",
        latencyMs: Date.now() - t0,
        metadata: { model: ocr.model, byteSize: buf.byteLength },
      });
      if (ocr.ok) {
        usedOcr = true;
        ext = {
          text: ocr.text,
          status: "ocr_ok",
          confidence: 0.55, // OCR is inherently lossy — never claim full confidence
          pageCount: ext.pageCount,
        };
      }
    }

    const decision = decideAnalyzer({
      status: ext.status,
      textLength: ext.text.length,
      aiAvailable: !!process.env.LOVABLE_API_KEY,
    });

    if (decision.analyzer === "skip") {
      // Persist a traceable record with the failure mode so admins can audit.
      const summary = PARSER_STATUS_MESSAGES[ext.status];
      await persistCanonicalAnalysis(supabase, {
        user_id: userId,
        resume_id: data.resumeId,
        ats_score: 0, summary, strengths: [], gaps: [], keywords: [], suggestions: [],
        method: "fallback",
        extraction_confidence: ext.confidence,
        parser_status: ext.status,
        extraction_error: ext.error ?? decision.reason,
      });
      return {
        ok: false as const,
        stage: "extract" as const,
        status: ext.status,
        message: summary,
        error: ext.error ?? null,
        confidence: ext.confidence,
      };
    }

    // 2. Analyze (AI primary, deterministic fallback)
    const analyzeInput = {
      text: ext.text,
      targetRole: data.targetRole,
      resumeId: data.resumeId,
      extractionConfidence: ext.confidence,
      parserStatus: ext.status,
    };

    try {
      const ai = await analyzeResume({ data: analyzeInput });
      return {
        ok: true as const,
        stage: "done" as const,
        mode: (usedOcr ? "ocr" : "ai") as "ai" | "ocr",
        status: ext.status,
        confidence: ext.confidence,
        ...ai,
      };
    } catch (e: any) {
      if (e instanceof AiCapError) throw e;
      const kw = await analyzeResumeKeywords({
        data: { ...analyzeInput, method: "fallback" as const },
      });
      return {
        ok: true as const,
        stage: "done" as const,
        mode: "fallback" as const,
        status: ext.status,
        confidence: ext.confidence,
        ...kw,
      };
    }
  });