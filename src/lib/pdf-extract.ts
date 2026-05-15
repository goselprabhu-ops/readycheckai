// Worker-compatible PDF text extraction using `unpdf`.
// Canonical caller: the `extractResumeText` server fn.

export type ParserStatus =
  | "ok"
  | "ocr_ok"
  | "empty_extraction"
  | "image_only_pdf"
  | "malformed_pdf"
  | "oversized"
  | "unsupported";

export interface ExtractionResult {
  text: string;
  status: ParserStatus;
  /** 0–1 — heuristic quality of the extraction. */
  confidence: number;
  pageCount: number;
  error?: string;
}

const MIN_USEFUL_CHARS = 80;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function extractPdfTextFromBytes(bytes: Uint8Array): Promise<string> {
  // Back-compat shim: returns text or empty string.
  const r = await extractPdf(bytes);
  return r.text;
}

export async function extractPdf(bytes: Uint8Array): Promise<ExtractionResult> {
  if (bytes.byteLength === 0) {
    return { text: "", status: "malformed_pdf", confidence: 0, pageCount: 0, error: "Empty file" };
  }
  if (bytes.byteLength > MAX_BYTES) {
    return {
      text: "",
      status: "oversized",
      confidence: 0,
      pageCount: 0,
      error: `File exceeds ${Math.round(MAX_BYTES / (1024 * 1024))} MB limit`,
    };
  }

  // Primary parser: unpdf (Worker-compatible).
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const pageCount = pdf.numPages ?? 0;
    const { text } = await extractText(pdf, { mergePages: true });
    const merged = (Array.isArray(text) ? text.join("\n") : text).trim();

    if (merged.length >= MIN_USEFUL_CHARS) {
      // Confidence rises with chars-per-page density; capped at 1.
      const density = pageCount > 0 ? merged.length / (pageCount * 1500) : merged.length / 1500;
      const confidence = Math.max(0.5, Math.min(1, density));
      return { text: merged, status: "ok", confidence, pageCount };
    }

    // Empty / very short extraction. If the PDF has pages but no text,
    // it's almost certainly an image-only / scanned PDF.
    if (pageCount > 0 && merged.length < 20) {
      return {
        text: "",
        status: "image_only_pdf",
        confidence: 0,
        pageCount,
        error: "PDF appears to be scanned/image-only — text extraction yielded nothing",
      };
    }
    return {
      text: merged,
      status: "empty_extraction",
      confidence: 0.1,
      pageCount,
      error: "Extracted too little text to analyze (under 80 characters)",
    };
  } catch (e: any) {
    return {
      text: "",
      status: "malformed_pdf",
      confidence: 0,
      pageCount: 0,
      error: e?.message ?? "Failed to parse PDF",
    };
  }
}
