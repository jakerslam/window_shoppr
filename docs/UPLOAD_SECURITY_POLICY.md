# File/Upload Security Policy

## Status
- Uploads are currently disabled in the product.
- This policy defines mandatory controls before uploads are enabled.

## Required controls
- MIME type allowlist by upload category.
- File-size limits by category.
- Signed URL flow required for upload transport.
- Quarantine scanning required before any public serving.
- Deny by default when policy is not explicitly enabled.

## Categories and baseline limits
- `image`: up to 8 MB (`image/jpeg`, `image/png`, `image/webp`, `image/avif`)
- `video`: up to 64 MB (`video/mp4`, `video/webm`)
- `document`: up to 12 MB (`application/pdf`)

## Serving and lifecycle rules
- Uploaded files must not be publicly served until malware scan passes.
- Quarantine failures route to manual/agent review queue.
- Signed upload tokens must be short-lived and scoped to one object key.
- Upload events and scan outcomes must be auditable.

## Implementation references
- Policy helper:
  - `src/shared/lib/platform/upload-security.ts`
- Future backend endpoints should enforce:
  - content-type validation
  - max-size checks
  - quarantine gate
  - signed URL verification
