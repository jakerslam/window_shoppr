# Monitoring and Error Reporting

## Scope
Production baseline for monitoring + error reporting across traces, runtime errors, and external ingestion.

## Components
- Observability core: `/src/shared/lib/engagement/monitoring.ts`
- Error reporting adapter: `/src/shared/lib/engagement/error-reporting.ts`

## Ingestion modes
1. Generic monitoring endpoint (`NEXT_PUBLIC_MONITORING_API_URL`)
   - Receives trace/error/log envelopes.
2. Sentry-compatible endpoint (`NEXT_PUBLIC_SENTRY_DSN`)
   - Receives normalized runtime error events.

## Events covered
- Runtime errors (`window_error`, `unhandled_rejection`, `react_error_boundary`)
- Route/navigation traces
- Uptime probe traces
- Structured logs with request IDs

## Validation
- Ensure env contains `NEXT_PUBLIC_MONITORING_API_URL` and/or `NEXT_PUBLIC_SENTRY_DSN`.
- Verify monitoring bootstrap emits errors/traces.
- Verify Sentry adapter receives `monitoring:error` forwarded events.
