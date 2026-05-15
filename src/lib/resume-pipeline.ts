// Resume Analysis Pipeline — orchestration layer.
//
// Centralizes: extraction → method selection → analyzer dispatch → canonical persist.
// Pure module (no top-level side effects); safe to import from server fns.

export type ResumeAnalysisMethod = "keyword" | "ai" | "ocr" | "fallback";

import type { ParserStatus } from "./pdf-extract";

export interface PipelineDecision {
  /** Which analyzer to run, given extraction quality. */
  analyzer: ResumeAnalysisMethod | "skip";
  /** Why — used in UI / logs / DB column. */
  reason: string;
}

export function decideAnalyzer(opts: {
  status: ParserStatus;
  textLength: number;
  aiAvailable: boolean;
}): PipelineDecision {
  if (opts.status === "image_only_pdf") {
    // Future: route to OCR. Today: surface a clean error to the user.
    return { analyzer: "skip", reason: "image_only_pdf" };
  }
  if (opts.status === "malformed_pdf" || opts.status === "oversized") {
    return { analyzer: "skip", reason: opts.status };
  }
  if (opts.status === "empty_extraction" || opts.textLength < 80) {
    return { analyzer: "skip", reason: "empty_extraction" };
  }
  if (opts.aiAvailable) {
    return { analyzer: "ai", reason: "primary" };
  }
  return { analyzer: "keyword", reason: "ai_unavailable" };
}

/**
 * Friendly, actionable error messages for UI surfaces.
 * Keep these short — components can wrap with extra guidance.
 */
export const PARSER_STATUS_MESSAGES: Record<ParserStatus, string> = {
  ok: "Resume parsed successfully.",
  empty_extraction:
    "We couldn't read enough text from this PDF. Try exporting it as a text-based PDF instead of a scan.",
  image_only_pdf:
    "This looks like a scanned PDF — we can't read its text yet. Please upload a text-based PDF (e.g. exported from Word or Google Docs).",
  malformed_pdf:
    "This PDF is corrupted or unreadable. Please re-export and try again.",
  oversized: "This file is too large. Please upload a PDF under 10 MB.",
  unsupported: "This file type isn't supported. Please upload a PDF.",
};