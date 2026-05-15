// Server-only OCR fallback for scanned PDFs.
//
// Sends the raw PDF bytes to a vision-capable model via the Lovable AI
// Gateway and asks it to transcribe everything verbatim. Returns plain
// text suitable for the existing analyzer pipeline.
//
// Designed to fail-soft: any error returns an empty result so the
// caller can fall back to the "image_only_pdf" surface message.

const OCR_MODEL = "google/gemini-2.5-pro";
const OCR_TIMEOUT_MS = 25_000;
const OCR_MAX_BYTES = 8 * 1024 * 1024;

function bytesToBase64(bytes: Uint8Array): string {
  // Worker runtime supports Buffer via nodejs_compat.
  return Buffer.from(bytes).toString("base64");
}

export interface OcrResult {
  ok: boolean;
  text: string;
  error?: string;
  /** raw upstream model name, for traceability */
  model: string;
}

export async function ocrPdfViaGateway(
  bytes: Uint8Array,
  apiKey: string,
): Promise<OcrResult> {
  if (!apiKey) return { ok: false, text: "", error: "no_api_key", model: OCR_MODEL };
  if (bytes.byteLength === 0)
    return { ok: false, text: "", error: "empty_file", model: OCR_MODEL };
  if (bytes.byteLength > OCR_MAX_BYTES)
    return { ok: false, text: "", error: "ocr_oversized", model: OCR_MODEL };

  const dataUrl = `data:application/pdf;base64,${bytesToBase64(bytes)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OCR_TIMEOUT_MS);

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "raw-fetch",
      },
      body: JSON.stringify({
        model: OCR_MODEL,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You are an OCR engine. Transcribe the document verbatim as plain UTF-8 text. Preserve section headings on their own line. Do not summarize, paraphrase, translate, or add commentary. If a page is unreadable, write [unreadable].",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this resume PDF verbatim." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        text: "",
        error: `ocr_http_${res.status}: ${body.slice(0, 200)}`,
        model: OCR_MODEL,
      };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = (json.choices?.[0]?.message?.content ?? "").trim();
    if (text.length < 80) {
      return { ok: false, text, error: "ocr_low_yield", model: OCR_MODEL };
    }
    return { ok: true, text, model: OCR_MODEL };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      text: "",
      error: msg.includes("aborted") ? "ocr_timeout" : `ocr_error: ${msg}`,
      model: OCR_MODEL,
    };
  } finally {
    clearTimeout(timer);
  }
}