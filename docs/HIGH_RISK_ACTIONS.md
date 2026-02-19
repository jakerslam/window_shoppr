# High-Risk Action Safeguards

- High-risk actions require explicit safeguard policies:
  - two-step confirmation for destructive admin actions.
  - approval-required flow for publish/takedown/moderation resolutions.
- Every high-risk action requires immutable audit coverage.
- Authorized executors:
  - `admin`: all high-risk actions.
  - `agent`: only `agent.*` high-risk actions.

Implementation reference:
- `src/shared/lib/platform/high-risk-actions.ts`
