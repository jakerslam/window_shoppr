import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const migrationDir = resolve(process.cwd(), "db/migrations");
if (!existsSync(migrationDir)) {
  console.error("Missing db/migrations directory.");
  process.exit(1);
}

const migrationFiles = readdirSync(migrationDir).filter((file) =>
  file.endsWith(".sql"),
);

if (migrationFiles.length === 0) {
  console.error("No SQL migrations found for rehearsal.");
  process.exit(1);
}

if (!existsSync(resolve(process.cwd(), "docs/MIGRATION_REHEARSAL.md"))) {
  console.error("Missing docs/MIGRATION_REHEARSAL.md.");
  process.exit(1);
}

console.log("Migration rehearsal checks passed.");
