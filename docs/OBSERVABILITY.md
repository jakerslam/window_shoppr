# Observability Baseline

## Scope
Baseline observability for client runtime behavior prior to full backend telemetry rollout.

## Implemented signals
- Structured logs with request correlation IDs.
- Runtime error capture:
  - `window_error`
  - `unhandled_rejection`
  - `react_error_boundary`
- Performance traces:
  - `initial_navigation`
  - `route_transition`
  - `uptime_check`

## Request ID and log model
Each monitoring event now carries `requestId`, `pathname`, and `timestamp`.
Structured logs are persisted in local storage under:
- `window_shoppr_monitoring_logs`

## Error and trace stores
- `window_shoppr_monitoring_errors`
- `window_shoppr_monitoring_traces`

## Uptime checks
A lightweight probe runs every 60s against `/robots.txt` and emits `uptime_check` trace events with:
- `durationMs`
- `metadata.ok`

## Forwarding model
When `NEXT_PUBLIC_MONITORING_API_URL` is configured, envelopes are forwarded best-effort via:
- `navigator.sendBeacon` (preferred)
- `fetch(..., { keepalive: true })` fallback

## Consent gate
Monitoring runs only when cookie mode is `all`.
