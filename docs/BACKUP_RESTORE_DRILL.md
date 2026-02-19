# Backup and Restore Drill

- Targets:
  - `RTO`: 4 hours
  - `RPO`: 30 minutes
- Frequency:
  - run restore verification at least monthly.
- Drill flow:
  - restore latest backup into isolated environment.
  - run migration + integrity checks.
  - verify seed/admin access + critical read/write paths.
  - record completion timestamp and operator.
