# Resume Analysis API

This CloudBase HTTP function defines the privacy boundary for optional resume analysis.

## Routes

- `GET /health`
- `POST /upload-session`
- `POST /analyze`
- `POST /cleanup` (scheduled and administrator-protected)

The function is intentionally disabled until a private CloudBase storage adapter, PDF/DOCX/OCR parser, and model adapter are injected through `configure()`. This prevents a partial deployment from accepting resume files without a guaranteed cleanup path.

## Required production adapters

The storage adapter must use the current CloudBase runtime binding rather than bundling an obsolete server SDK. It creates ten-minute owner-bound uploads, verifies PDF/DOCX magic bytes and size without a general-purpose media sniffer, atomically claims a session, deletes files in `finally`, and removes abandoned uploads through `removeExpired()`.

The parser uses `pdf-parse` for text PDFs, `mammoth` for DOCX, and a Tencent OCR adapter for scanned pages. The model adapter receives redacted text and must return the fixed structure validated by `protocol.js`. Provider credentials belong only in CloudBase environment variables.

Never log request bodies, extracted text, model prompts, model output, filenames, contact details, or structured resume fields.
