# Incident Response Readiness

## SLOs
- Availability SLO (web): `99.5%` rolling 30-day uptime.
- Error-budget policy: `0.5%` monthly budget; freeze feature releases when budget is exhausted.
- Latency objective (web): p95 route transition trace under `2500ms`.

## Alert thresholds
- Critical availability alert: uptime check failure rate `>= 20%` over 5 minutes.
- Error alert: runtime error events (`window_error` + `unhandled_rejection`) `>= 15` in 10 minutes.
- Performance alert: p95 `route_transition` `>= 3500ms` for 15 minutes.

## Severity model
- `SEV-1`: broad outage or data loss risk.
- `SEV-2`: major degraded experience without full outage.
- `SEV-3`: localized degradation or non-critical feature failure.

## Escalation flow
1. Triggering alert opens incident channel and assigns incident commander.
2. Incident commander classifies severity and activates runbook.
3. Primary responder executes mitigation and logs timeline entries every 15 minutes.
4. Escalate to backup responder if no mitigation within 20 minutes.
5. Close incident only after stability window of 30 minutes.

## On-call rotation policy
- Weekly rotation: Primary + Secondary.
- Hand-off every Monday 09:00 local time.
- Secondary acknowledges alerts if primary has not responded within 10 minutes.

## Runbooks
- `/docs/runbooks/availability.md`
- `/docs/runbooks/error-spike.md`
- `/docs/runbooks/performance-degradation.md`
