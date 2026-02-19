import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = [
  "docs/BACKUP_RESTORE_DRILL.md",
  "docs/MIGRATIONS.md",
  "db/migrations",
];

for (const file of requiredFiles) {
  if (!existsSync(resolve(process.cwd(), file))) {
    console.error(`Missing backup/restore artifact: ${file}`);
    process.exit(1);
  }
}

const drillDoc = readFileSync(
  resolve(process.cwd(), "docs/BACKUP_RESTORE_DRILL.md"),
  "utf8",
);

const requiredPhrases = ["RTO", "RPO", "restore verification", "frequency"];
for (const phrase of requiredPhrases) {
  if (!drillDoc.toLowerCase().includes(phrase.toLowerCase())) {
    console.error(`Backup/restore drill doc missing phrase: ${phrase}`);
    process.exit(1);
  }
}

console.log("Backup/restore readiness checks passed.");
