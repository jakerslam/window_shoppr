# Release Checklist

## Pre-release
- [ ] All required CI checks green (`lint`, `typecheck`, `unit`, `integration`, `coverage`, `db-safety`, `incident-readiness`, `security`, `build`, `e2e`, `performance-budget`).
- [ ] No open SEV-1 or SEV-2 incidents.
- [ ] `npm run release:smoke` passes against build artifact.
- [ ] SRS reflects completed scope for release.

## Staging validation
- [ ] Deploy staging artifact from target commit.
- [ ] Verify login/signup flow.
- [ ] Verify product detail route and affiliate CTA.
- [ ] Verify wishlist read/write behavior.
- [ ] Verify monitoring traces and uptime probes emitting.

## Production promotion
- [ ] Tag release commit.
- [ ] Deploy to production.
- [ ] Run smoke checks immediately post-deploy.
- [ ] Record deployment notes and rollback target commit.

## Rollback
- [ ] If regression is detected, deploy previous stable commit.
- [ ] Re-run smoke checks and incident timeline update.
