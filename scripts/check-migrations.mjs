import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATIONS_DIR = resolve(process.cwd(), "db/migrations");
const ROLLBACKS_DIR = resolve(process.cwd(), "db/rollbacks");
const SEEDS_DIR = resolve(process.cwd(), "db/seeds");

/**
 * Return sorted SQL filenames from a folder.
 */
const listSqlFiles = (directory) =>
  readdirSync(directory)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

/**
 * Ensure migration files are versioned and strictly sequential.
 */
const assertSequentialVersions = (files, label) => {
  files.forEach((file, index) => {
    const expectedPrefix = String(index + 1).padStart(3, "0");
    if (!file.startsWith(`${expectedPrefix}_`)) {
      throw new Error(`${label} file out of sequence: expected prefix ${expectedPrefix}_ in ${file}`);
    }
  });
};

/**
 * Ensure every migration has a rollback partner with matching filename.
 */
const assertRollbackPairs = (migrationFiles, rollbackFiles) => {
  migrationFiles.forEach((file) => {
    if (!rollbackFiles.includes(file)) {
      throw new Error(`Missing rollback for migration ${file}`);
    }
  });
};

/**
 * Ensure seed SQL is deterministic (fixed timestamps; no random()).
 */
const assertDeterministicSeeds = (seedFiles) => {
  seedFiles.forEach((file) => {
    const content = readFileSync(resolve(SEEDS_DIR, file), "utf8").toLowerCase();
    if (content.includes("now()") || content.includes("current_timestamp") || content.includes("random()")) {
      throw new Error(`Seed ${file} is non-deterministic (contains now/current_timestamp/random).`);
    }
  });
};

const migrationFiles = listSqlFiles(MIGRATIONS_DIR);
const rollbackFiles = listSqlFiles(ROLLBACKS_DIR);
const seedFiles = listSqlFiles(SEEDS_DIR);

if (migrationFiles.length === 0) {
  throw new Error("No migration files found in db/migrations.");
}

if (seedFiles.length === 0) {
  throw new Error("No seed files found in db/seeds.");
}

assertSequentialVersions(migrationFiles, "Migration");
assertSequentialVersions(rollbackFiles, "Rollback");
assertSequentialVersions(seedFiles, "Seed");
assertRollbackPairs(migrationFiles, rollbackFiles);
assertDeterministicSeeds(seedFiles);

console.log(
  `Migration safety checks passed. migrations=${migrationFiles.length}, rollbacks=${rollbackFiles.length}, seeds=${seedFiles.length}`,
);
