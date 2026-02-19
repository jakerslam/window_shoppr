# Performance Budget Gate

## CI enforcement
Performance budgets are enforced in `quality-checks.yml` via job `performance-budget` running:

```bash
npm run audit:lighthouse
```

Budgets are defined in `/lighthouserc.json` and fail CI on violation.

## Current mobile-oriented thresholds
- `categories:performance` >= `0.75`
- `largest-contentful-paint` <= `4000ms`
- `total-blocking-time` <= `500ms`
- `cumulative-layout-shift` <= `0.25`

## Routes audited
- `/`
- `/wishlist/`
- `/product/cozy-cloud-throw-blanket/`

## Tuning policy
Adjust budgets only with documented reason in PR and updated baseline evidence.
