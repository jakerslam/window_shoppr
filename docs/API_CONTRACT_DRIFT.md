# API Contract Drift Prevention

- Source of truth:
  - `docs/api/openapi-agent.json`
  - `src/shared/lib/agent/ingestion-schema.ts`
- CI guard ensures critical endpoint and schema markers remain aligned.
- Contract updates require:
  - schema update
  - OpenAPI update
  - contract test update
