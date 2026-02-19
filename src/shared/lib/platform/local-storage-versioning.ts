"use client";

export const LOCAL_STORAGE_SCHEMA_VERSION = 1;
const VERSION_KEY = "window_shoppr_storage_schema_version";

type StorageMigration = {
  toVersion: number;
  run: () => void;
};

const MIGRATIONS: StorageMigration[] = [];

/**
 * Get current local storage schema version.
 */
export const getLocalStorageSchemaVersion = () => {
  if (typeof window === "undefined") {
    return LOCAL_STORAGE_SCHEMA_VERSION;
  }

  const raw = window.localStorage.getItem(VERSION_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Apply local storage migrations up to the current schema version.
 */
export const migrateLocalStorageSchema = () => {
  if (typeof window === "undefined") {
    return;
  }

  let currentVersion = getLocalStorageSchemaVersion();
  const ordered = [...MIGRATIONS].sort((a, b) => a.toVersion - b.toVersion);
  for (const migration of ordered) {
    if (migration.toVersion <= currentVersion) {
      continue;
    }

    migration.run();
    currentVersion = migration.toVersion;
    window.localStorage.setItem(VERSION_KEY, String(currentVersion));
  }

  if (currentVersion < LOCAL_STORAGE_SCHEMA_VERSION) {
    window.localStorage.setItem(
      VERSION_KEY,
      String(LOCAL_STORAGE_SCHEMA_VERSION),
    );
  }
};
