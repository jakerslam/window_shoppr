# Agent/Admin Moderation Command Surface

- Supported commands:
  - approve/reject submissions
  - resolve reports
  - takedown listings/comments
  - ban/unban users
- All moderation commands must emit immutable audit events.
- Audit model uses hash-chaining (`previousHash` -> `hash`) per event.

Implementation reference:
- `src/shared/lib/agent/moderation-commands.ts`
