# Runbook: Runtime Error Spike

## Trigger
Error volume alert (`>=15` runtime errors in 10 minutes).

## Immediate actions
1. Identify top error signatures from monitoring logs.
2. Confirm impact scope by route and browser.
3. Correlate with recent deploy and feature flags.

## Mitigation
1. Disable suspect feature flags.
2. Roll back if errors remain above threshold for 20 minutes.
3. Add temporary guard/fallback around failing boundary if rollback blocked.

## Exit criteria
- Error rate below threshold for 30 minutes.
- Root cause identified and tracked in postmortem.
