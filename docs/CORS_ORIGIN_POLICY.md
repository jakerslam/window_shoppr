# CORS and Origin Allowlist Policy

## Objective
- Enforce deny-by-default mutation behavior unless the browser origin is explicitly allowlisted per environment.

## Frontend enforcement
- `requestDataApi` blocks non-`GET` requests when current browser origin is not allowlisted.
- Block response shape:
  - `ok: false`
  - `status: 403`
  - message: `"Request blocked by origin policy."`

## Configuration
- Environment variable: `NEXT_PUBLIC_ALLOWED_ORIGINS`
- Format: comma-separated origins (full scheme + host), e.g.:
  - `https://window-shoppr.com,https://www.window-shoppr.com`

## Backend requirements (must also be enforced server-side)
- Return restrictive CORS headers from API:
  - `Access-Control-Allow-Origin` only for allowlisted origins.
  - `Vary: Origin`.
  - Reject unknown origins on mutation routes.
- Validate `Origin` for all state-changing endpoints.
