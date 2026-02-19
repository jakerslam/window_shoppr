import { MIGRATIONS_DIR, SEEDS_DIR, listSqlFiles, readSqlFile, withDatabase, ensureSchemaMigrationsTable, SCHEMA_MIGRATIONS_TABLE } from "./utils.mjs";

const SEED_TABLES = ["products", "wishlists", "wishlist_items"];
const CORE_TABLES = ["products", "wishlists", "email_captures", "blog_articles"];

const measureRowCounts = async (db, tables) => {
  const counts = {};
  for (const table of tables) {
    try {
      const row = await db.queryOne(`SELECT COUNT(1) as count FROM ${table}`);
      counts[table] = Number(row?.count ?? 0);
    } catch (error) {
      counts[table] = null;
      console.warn(`Unable to count ${table}: ${error.message}`);
    }
  }
  return counts;
};

const executeSeedFiles = async (db) => {
  const files = listSqlFiles(SEEDS_DIR);
  for (const file of files) {
    const sql = readSqlFile(SEEDS_DIR, file);
    await db.exec(sql);
  }
};

const runCanaryChecks = async (db) => {
  const duplicateProducts = await db.query(
    "SELECT slug, COUNT(1) as cnt FROM products GROUP BY slug HAVING COUNT(1) > 1",
  );
  if (duplicateProducts.length > 0) {
    throw new Error(`Duplicate product slugs detected: ${duplicateProducts.map((row) => row.slug).join(", ")}`);
  }

  const duplicateWishlistItems = await db.query(
    "SELECT wishlist_id, product_id, COUNT(1) as cnt FROM wishlist_items GROUP BY wishlist_id, product_id HAVING COUNT(1) > 1",
  );
  if (duplicateWishlistItems.length > 0) {
    throw new Error(
      `Duplicate wishlist entries detected: ${duplicateWishlistItems
        .map((row) => `${row.wishlist_id}:${row.product_id}`)
        .join(", ")}`,
    );
  }

  console.log("Canary constraint checks passed (indexes/uniqueness in good standing).");
};

const run = async () => {
  await withDatabase(async (db) => {
    await ensureSchemaMigrationsTable(db);
    const migrations = listSqlFiles(MIGRATIONS_DIR);
    const appliedRows = await db.query(`SELECT name FROM ${SCHEMA_MIGRATIONS_TABLE}`);
    const appliedSet = new Set(appliedRows.map((row) => row.name));

    const pending = migrations.filter((file) => !appliedSet.has(file));
    console.log(`Migration check: ${appliedSet.size} applied, ${pending.length} pending of ${migrations.length}.`);
    if (pending.length > 0) {
      pending.forEach((file) => console.log(`  - pending: ${file}`));
    }
    
    const countsBefore = await measureRowCounts(db, SEED_TABLES);
    await executeSeedFiles(db);
    const countsAfterFirst = await measureRowCounts(db, SEED_TABLES);
    await executeSeedFiles(db);
    const countsAfterSecond = await measureRowCounts(db, SEED_TABLES);

    SEED_TABLES.forEach((table) => {
      if (countsAfterFirst[table] !== countsAfterSecond[table]) {
        throw new Error(`Seed idempotency failure for ${table}: ${countsAfterFirst[table]} != ${countsAfterSecond[table]}`);
      }
    });
    console.log("Seed idempotency verified (staging/seed SQL is deterministic).\n  Counts after seeds:");
    SEED_TABLES.forEach((table) => {
      console.log(`  - ${table}: ${countsAfterSecond[table]} (before: ${countsBefore[table]})`);
    });

    const coreCounts = await measureRowCounts(db, CORE_TABLES);
    console.log("Core table row counts:");
    CORE_TABLES.forEach((table) => {
      console.log(`  - ${table}: ${coreCounts[table] ?? "n/a"}`);
    });

    await runCanaryChecks(db);
    console.log("Data integrity verification complete.");
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
