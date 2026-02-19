import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ROLLBACKS_DIR, readSqlFile, ensureSchemaMigrationsTable, SCHEMA_MIGRATIONS_TABLE, withDatabase } from "./utils.mjs";

const run = async () => {
  await withDatabase(async (db) => {
    await ensureSchemaMigrationsTable(db);
    const latest = await db.queryOne(
      `SELECT name FROM ${SCHEMA_MIGRATIONS_TABLE} ORDER BY applied_at DESC LIMIT 1`,
    );

    if (!latest?.name) {
      console.log("No migrations to roll back.");
      return;
    }

    const rollbackFile = latest.name;
    const rollbackPath = resolve(ROLLBACKS_DIR, rollbackFile);

    if (!existsSync(rollbackPath)) {
      throw new Error(`Rollback script missing for ${rollbackFile}`);
    }

    const sql = readSqlFile(ROLLBACKS_DIR, rollbackFile);
    console.log(`Rolling back ${rollbackFile}...`);
    await db.exec(sql);
    await db.exec(`DELETE FROM ${SCHEMA_MIGRATIONS_TABLE} WHERE name = ?`, [rollbackFile]);
    console.log(`Rollback of ${rollbackFile} complete.`);
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
