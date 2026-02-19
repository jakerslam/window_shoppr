# Auth and Authorization Hardening

## Scope
This phase hardens local/session auth behavior until backend auth replaces fallback flows.

## Implemented controls
- Role-bearing session model (`user`, `editor`, `agent`, `admin`).
- Session lifecycle fields: `sessionId`, `issuedAt`, `expiresAt`.
- Automatic expiry invalidation on session read.
- Idle timeout invalidation (2 hours since last activity).
- Absolute timeout invalidation (14 days max session age).
- Session-id rotation after prolonged inactivity on activity touch.
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
- Local-first audit sink: `window_shoppr_privileged_audit_log`.
- Optional API forwarding: `POST /data/auth/audit` via data API adapter.

## Migration note
This remains local-first until backend auth/session infrastructure is live (`D7`).
