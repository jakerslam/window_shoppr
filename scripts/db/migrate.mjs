import { MIGRATIONS_DIR, listSqlFiles, readSqlFile, SCHEMA_MIGRATIONS_TABLE, withDatabase, ensureSchemaMigrationsTable } from "./utils.mjs";

const applyMigration = async (db, file) => {
  const existing = await db.queryOne(`SELECT name FROM ${SCHEMA_MIGRATIONS_TABLE} WHERE name = ?`, [file]);
  if (existing) {
    console.log(`Skipping ${file} (already applied).`);
    return;
  }

  const sql = readSqlFile(MIGRATIONS_DIR, file);
  console.log(`Applying migration ${file}...`);
  await db.exec(sql);
  await db.exec(
    `INSERT INTO ${SCHEMA_MIGRATIONS_TABLE} (name, applied_at) VALUES (?, ?)`,
    [file, new Date().toISOString()],
  );
};

const run = async () => {
  await withDatabase(async (db) => {
    await ensureSchemaMigrationsTable(db);
    const migrations = listSqlFiles(MIGRATIONS_DIR);
    if (migrations.length === 0) {
      console.warn("No migration files found.");
      return;
    }

    for (const file of migrations) {
      await applyMigration(db, file);
    }

    console.log("Migrations complete.");
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
