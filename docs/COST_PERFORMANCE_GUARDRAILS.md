# Cost and Performance Guardrails

- Performance budgets are enforced in CI via Lighthouse assertions.
- Build and e2e gates must pass before release.
- Cost guardrails:
  - set monthly API usage budget per provider.
  - alert at 70% and 90% budget thresholds.
  - rate-limit bursty write paths to control abuse-driven costs.
