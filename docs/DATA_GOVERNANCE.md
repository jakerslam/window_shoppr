# Data Governance Controls

## Scope
Implements local-first data governance controls for retention, export, deletion, and consent-linked handling.

## Controls implemented
- Retention policy map by storage key (`DATA_RETENTION_RULES`).
- Automatic retention pruning on app bootstrap.
- User data export bundle for portability workflows.
- User data deletion flow for account deletion requests.
- Consent-linked storage discipline for analytics/ops keys.

## Source
- `/src/shared/lib/platform/data-governance.ts`
- `/src/shared/components/privacy/DataGovernanceBootstrap.tsx`

## Retention model
Rules define:
- `storageKey`
- `retentionDays`
- `purpose`
- `requiresConsent`

## User rights operations
- Export: `exportUserDataBundle()`
- Delete: `deleteUserDataBundle()`

## Integration note
Current behavior is local-first; backend delete/export endpoints should mirror these semantics during production cutover.
