# Launch Auth Cleanup

## Goal
Require backend auth endpoints in production runtime and disable local fallback account/session behavior.

## Controls
- `NEXT_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK=false` in production runtime.
- `NEXT_PUBLIC_AUTH_API_URL` must be configured.
- Auth flows throw/return explicit errors when backend auth is required but unavailable.

## Source
- `/src/shared/lib/platform/auth/launch-guard.ts`
- `/src/shared/lib/platform/auth/api.ts`
- `/src/shared/lib/platform/auth/service.ts`

## Production checklist
- [ ] `NEXT_PUBLIC_DEPLOY_TARGET=runtime`
- [ ] `NEXT_PUBLIC_AUTH_API_URL` set
- [ ] `NEXT_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK=false`
- [ ] Login/signup/provider auth verified against backend API
