# Auth and Authorization Hardening

## Scope
This phase hardens local session semantics and backend auth flows, including runtime HttpOnly-cookie sessions.

## Implemented controls
- Role-bearing session model (`user`, `editor`, `agent`, `admin`).
- Session lifecycle fields: `sessionId`, `issuedAt`, `expiresAt`.
- Automatic expiry invalidation on session read.
- Idle timeout invalidation (2 hours since last activity).
- Absolute timeout invalidation (14 days max session age).
- Session-id rotation after prolonged inactivity on activity touch.
- Backend-issued HttpOnly session cookie (`ws_session` by default) with configurable domain/same-site/secure flags.
- Backend session bootstrap endpoint: `GET /auth/session`.
- Backend account mutation endpoint: `PATCH /auth/account`.
- Frontend auth API requests use `credentials: "include"` for cookie-backed runtime auth.
- Privileged authorization guard for agent queue mutations.
- Privileged audit logging for auth decisions and agent queue actions.

## Role policy
- `user`: standard browsing, save, comments.
- `editor`: reserved for future moderation/content tools.
- `agent`: privileged automation operations.
- `admin`: full privileged access.

## Privileged actions audited
- `agent.auth.session_role`
- `agent.auth.api_key`
- `agent.queue.product_upsert`
- `agent.queue.product_publish`
- `agent.queue.moderation_resolve`
- `agent.queue.signal_submission`

## Storage and forwarding
- Session metadata cache in local storage for UI convenience; source of truth is backend cookie session in runtime mode.
- Local-first audit sink: `window_shoppr_privileged_audit_log`.
- Optional API forwarding: `POST /data/auth/audit` via data API adapter.

## Migration note
Static-export beta can still use local fallback auth. Runtime production should set `NEXT_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK=false` and require backend auth endpoints.
