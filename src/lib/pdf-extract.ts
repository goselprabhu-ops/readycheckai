// Worker-compatible PDF text extraction using `unpdf`.
// This module is import-safe in both browser and server bundles, but the
// canonical caller is the `extractResumeText` server fn — moving extraction
// off the browser keeps bundles small and removes the pdfjs worker hack.
export async function extractPdfTextFromBytes(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return (Array.isArray(text) ? text.join("\n") : text).trim();
}
