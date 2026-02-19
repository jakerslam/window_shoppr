import { SEEDS_DIR, listSqlFiles, readSqlFile, withDatabase } from "./utils.mjs";

const run = async () => {
  await withDatabase(async (db) => {
    const seeds = listSqlFiles(SEEDS_DIR);
    if (seeds.length === 0) {
      console.warn("No seed files found.");
      return;
    }

    for (const file of seeds) {
      console.log(`Applying seed ${file}...`);
      const sql = readSqlFile(SEEDS_DIR, file);
      await db.exec(sql);
    }

    console.log("Deterministic staging seeds applied.");
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
