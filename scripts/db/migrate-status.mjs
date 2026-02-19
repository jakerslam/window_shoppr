import { MIGRATIONS_DIR, listSqlFiles, withDatabase, ensureSchemaMigrationsTable, SCHEMA_MIGRATIONS_TABLE } from "./utils.mjs";

const run = async () => {
  await withDatabase(async (db) => {
    await ensureSchemaMigrationsTable(db);
    const migrations = listSqlFiles(MIGRATIONS_DIR);
    const appliedRows = await db.query(`SELECT name, applied_at FROM ${SCHEMA_MIGRATIONS_TABLE}`);
    const applied = new Map(appliedRows.map((row) => [row.name, row.applied_at]));

    if (migrations.length === 0) {
      console.warn("No migration files found.");
      return;
    }

    migrations.forEach((file) => {
      const status = applied.has(file) ? "APPLIED" : "PENDING";
      const when = applied.get(file);
      console.log(`${status.padEnd(8)} ${file}${when ? ` (applied: ${when})` : ""}`);
    });

    const pending = migrations.filter((file) => !applied.has(file));
    if (pending.length === 0) {
      console.log("All migrations are applied.");
    } else {
      console.log(`${pending.length} migration(s) pending. Run npm run db:migrate to apply.`);
    }
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
