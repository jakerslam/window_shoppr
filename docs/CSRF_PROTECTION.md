# CSRF Protection

## Scope
- Mutation requests sent via `requestDataApi` include CSRF and origin headers.
- Methods covered: `POST`, `PATCH`, `PUT`, `DELETE`.

## Implementation
- CSRF token source: browser local storage.
- Rotation: token rotates every 12 hours.
- Outbound headers:
  - `x-csrf-token`
  - `x-window-origin`

## Backend enforcement contract
- Validate `x-csrf-token` against server-side session/token policy.
- Validate `Origin` and/or `x-window-origin` against allowlisted origins.
- Reject invalid/missing tokens with `403`.

## Notes
- This is a frontend compatibility layer for the backend CSRF enforcement cutover.
- Final production model should use secure HttpOnly session cookies + server-issued CSRF tokens.
