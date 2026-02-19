# Migration Rehearsal Automation

- Rehearsal must cover:
  - forward migrate on fresh DB
  - forward migrate on seeded DB
  - rollback verification
  - post-rollback smoke checks
- CI guard validates migration inventory and rehearsal documentation.
- Before launch, replace documentation-only rehearsal with executable DB job in CI.
