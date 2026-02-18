# Database Migrations

## Goal
Provide safe, reviewable, deterministic SQL evolution for launch-ready backend migration.

## Directory layout
- `db/migrations`: forward migration SQL (`NNN_name.sql`)
- `db/rollbacks`: rollback SQL with matching filename
- `db/seeds`: deterministic seed SQL (`NNN_name.sql`)

## Rules
- Migrations are strictly ordered by numeric prefix (`001_`, `002_`, ...).
- Every migration must have a rollback file with the same filename.
- Seed scripts must be deterministic (no `now()`, `current_timestamp`, `random()`).
- Idempotent patterns are required where practical (`IF NOT EXISTS`, `ON CONFLICT`).

## Validation
Run:

```bash
npm run db:check
```

This validates sequence ordering, rollback pairing, and deterministic seed constraints.

## Apply order (backend rollout)
1. Apply all files in `db/migrations` in lexical order.
2. Apply seeds in `db/seeds` in lexical order.
3. If rollback needed, apply matching file from `db/rollbacks` in reverse order.

## Current baseline
- `001_initial_schema.sql`
- `002_agent_queue_schema.sql`
- `001_seed_base_data.sql`
