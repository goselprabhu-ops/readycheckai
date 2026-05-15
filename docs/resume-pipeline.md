# Resume Pipeline (Phase 3)

End-to-end flow: upload → extract → (OCR if scanned) → analyze → persist.

## Stages

1. **Upload** — client uploads PDF to the `resumes` storage bucket
   (path: `<userId>/<ts>-<safe-name>`). RLS scopes reads/writes to the owner.
2. **Register** — `registerResumeUpload` server fn inserts a row into
   `public.resumes`. This row's `id` is the canonical key for the analysis.
3. **Pipeline** — `runResumePipeline` (server fn):
   - Downloads the file via the user-scoped Supabase client.
   - Runs `extractPdf` (unpdf, Worker-compatible).
   - If `parser_status === 'image_only_pdf'` AND `LOVABLE_API_KEY` is set,
     calls `ocrPdfViaGateway` — a `gemini-2.5-pro` chat completion that
     transcribes the PDF verbatim. Result becomes `parser_status === 'ocr_ok'`,
     `extraction_confidence = 0.55`.
   - Calls `decideAnalyzer` to choose AI vs deterministic keyword vs skip.
   - Persists exactly one row per `resume_id` to `resume_analyses` (UPSERT
     on `resume_id`).
4. **Cleanup** — `pg_cron` job `prune-failed-resume-analyses` runs every
   Sunday at 02:00 UTC and deletes failed analyses (`parser_status <> 'ok'`)
   older than 30 days. Successful analyses are kept indefinitely.

## `parser_status` values

| Status            | Meaning                                                       |
|-------------------|---------------------------------------------------------------|
| `ok`              | Text-based PDF, parsed cleanly                                |
| `ocr_ok`          | Scanned PDF, transcribed via gateway OCR                      |
| `empty_extraction`| Parser ran but produced <80 useful chars                      |
| `image_only_pdf`  | Scanned PDF and OCR was unavailable / failed                  |
| `malformed_pdf`   | Corrupt or unreadable PDF                                     |
| `oversized`       | >10 MB upload                                                 |
| `unsupported`     | Non-PDF file slipped through                                  |

## `mode` values returned to UI

- `ai` — text PDF analyzed by Lovable AI
- `ocr` — scanned PDF, OCR'd then analyzed by AI
- `fallback` — deterministic keyword analyzer (AI unavailable / quota hit)

## Observability

- Each OCR attempt logs `event_type='resume_ocr'` to `system_events` with
  latency, byte size, model, and outcome.
- The cleanup cron logs `event_type='resume_cleanup'` with the deleted count.
- Admin diagnostics page: System Events → filter `source='resume-pipeline'`.

## When to add a real worker queue

Synchronous pipeline is fine while p95 < 25 s. If OCR latency starts pushing
the Worker request budget (Cloudflare default 30 s wall clock), enqueue the
OCR step into the existing `pgmq` infra:

1. Insert a `resume_analyses` row with `status='queued'`.
2. Push `{ resume_id, file_path }` onto a new `resume_extract` queue.
3. Drain via the existing email-queue worker pattern in
   `src/routes/api/public/email/...`.
4. Client polls `resume_analyses.status` (or subscribes via Realtime).

The `status` column on `resume_analyses` already exists (`queued` /
`processing` / `ready` / `failed`) so wiring in a worker is purely an
add-on, not a refactor.