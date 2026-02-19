# Launch Auth Cleanup

## Goal
Require backend auth endpoints in production runtime, switch to secure HttpOnly cookie sessions, and disable local fallback account/session behavior.

## Controls
- `NEXT_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK=false` in production runtime.
- `NEXT_PUBLIC_AUTH_API_URL` must be configured.
- Backend sets/clears HttpOnly session cookies on `/auth/signup`, `/auth/login`, `/auth/social`, `/auth/logout`.
- Frontend uses `credentials: "include"` and bootstraps from `GET /auth/session`.
- Auth flows throw/return explicit errors when backend auth is required but unavailable.

## Source
- `/src/shared/lib/platform/auth/launch-guard.ts`
- `/src/shared/lib/platform/auth/api.ts`
- `/src/shared/lib/platform/auth/service.ts`
- `/src/shared/lib/platform/useAuthSessionState.ts`
- `/server/routes/auth.mjs`
- `/server/config.mjs`

## Production checklist
- [ ] `NEXT_PUBLIC_DEPLOY_TARGET=runtime`
- [ ] `NEXT_PUBLIC_AUTH_API_URL` set
- [ ] `NEXT_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK=false`
- [ ] `WINDOW_SHOPPR_SESSION_COOKIE_SECURE=true`
- [ ] Login/signup/provider auth verified against backend API + HttpOnly cookie session
- [ ] `GET /auth/session` refresh survives page reloads in runtime mode
