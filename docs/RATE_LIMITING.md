# Rate Limiting and Abuse Guard

## Scope
- Client-side write actions are protected with local-first throttles.
- Guarded actions:
  - `deal_submission_write`
  - `comment_write`
  - `report_write`
  - `email_capture_write`

## Behavior
- Per-session/per-browser actor keying.
- Sliding-window request caps per action.
- Burst cooldown lockout when cap is exceeded.
- Idempotency window to suppress duplicate submits.
- 429-compatible response payload (`statusCode`, `retryAfterMs`, message).
- Violation alert events forwarded through `reportErrorEvent` (warning level).

## Current limits
- Deal submission: 6 requests / 10 minutes, 3-minute cooldown.
- Comments: 4 requests / 2 minutes, 30-second cooldown.
- Reports: 8 requests / 10 minutes, 2-minute cooldown.
- Email capture: 4 requests / 10 minutes, 5-minute cooldown.

## Notes
- This is a browser-side safety layer for MVP resilience.
- Server-side rate limiting (IP/device/token), CAPTCHA/bot challenge, and WAF rules are still required for production backend endpoints.
