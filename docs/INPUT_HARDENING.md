# Input/Output Hardening

## Scope
- Centralized user-input sanitization and validation utilities.
- Wired into current user-generated write paths:
  - comments
  - reports
  - deal submissions
  - email capture

## Input controls
- Remove control characters.
- Normalize whitespace/newlines.
- Enforce max lengths by field.
- Validate critical formats:
  - email format
  - display name character policy
  - comment length bounds

## Output safety rules
- Render user content only as plain text nodes (no `dangerouslySetInnerHTML`).
- Keep UGC text sanitized at write-time and constrained at read-time.
- Reject invalid payloads before storage/API submission.

## Backend follow-up
- Mirror these constraints server-side as source-of-truth.
- Add DB constraints for field lengths and schema validation.
