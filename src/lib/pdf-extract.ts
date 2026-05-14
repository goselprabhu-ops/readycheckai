// Client-side PDF text extraction using pdfjs-dist.
// Architecture is intentionally isolated so it can be swapped for a
// server-side extractor (or OpenAI file ingestion) in the future.

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs: any = await import(/* @vite-ignore */ "pdfjs-dist/build/pdf.mjs" as any);
  const workerSrc = (await import(/* @vite-ignore */ "pdfjs-dist/build/pdf.worker.mjs?url" as any)).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return out.trim();
}
