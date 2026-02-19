# Runbook: Performance Degradation

## Trigger
p95 route transition latency above `3500ms` for 15 minutes.

## Immediate actions
1. Confirm Lighthouse budget regressions on key routes.
2. Identify largest recent bundle/content changes.
3. Check whether regression is global or route-specific.

## Mitigation
1. Roll back regression-causing release.
2. Disable heavy experiments/feature flags.
3. Ship fast-follow patch for payload reduction.

## Exit criteria
- p95 route transition below threshold for 30 minutes.
- Performance budget checks passing in CI.
