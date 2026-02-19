# Runbook: Availability Incident

## Trigger
Uptime check alert fired (`>=20%` failure rate over 5 minutes).

## Immediate actions
1. Confirm issue in browser + synthetic probe.
2. Verify latest deployment status and rollback candidate.
3. Check `/robots.txt` and homepage accessibility from two regions.

## Mitigation
1. Roll back latest deploy if incident started after release.
2. Disable high-risk feature flags if rollback is not immediate.
3. Keep status updates in incident timeline every 15 minutes.

## Exit criteria
- Uptime checks stable for 30 minutes.
- No new critical alerts.
