# Local Storage Schema Versioning

- Local storage schema version key:
  - `window_shoppr_storage_schema_version`
- Versioned migration utility:
  - `src/shared/lib/platform/local-storage-versioning.ts`
- Policy:
  - migrations must be forward-only
  - migration side effects must be idempotent
  - write final schema version after successful migration
