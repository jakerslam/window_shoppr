import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SERVER_CONFIG } from "../server/config.mjs";
import { openDatabase } from "../server/db.mjs";

const MIGRATIONS_DIR = resolve(process.cwd(), "db", "migrations");
const ROLLBACKS_DIR = resolve(process.cwd(), "db", "rollbacks");
const SEEDS_DIR = resolve(process.cwd(), "db", "seeds");
const SCHEMA_MIGRATIONS_TABLE = "schema_migrations";

const listSqlFiles = (directory) =>
  readdirSync(directory)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

const readSqlFile = (directory, file) => readFileSync(resolve(directory, file), "utf8");

const connectDatabase = () =>
  openDatabase({
    sqlitePath: SERVER_CONFIG.sqlitePath,
    databaseUrl: SERVER_CONFIG.databaseUrl,
    autoMigrate: false,
    seedFromJson: false,
  });

const withDatabase = async (fn) => {
  const db = await connectDatabase();
  try {
    return await fn(db);
  } finally {
    await db.close();
  }
};

const ensureSchemaMigrationsTable = async (db) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA_MIGRATIONS_TABLE} (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
};

export {
  MIGRATIONS_DIR,
  ROLLBACKS_DIR,
  SEEDS_DIR,
  SCHEMA_MIGRATIONS_TABLE,
  listSqlFiles,
  readSqlFile,
  withDatabase,
  ensureSchemaMigrationsTable,
};
