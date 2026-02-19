import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const { Pool } = pg;

/**
 * Replace SQLite-style `?` placeholders with Postgres `$1`-style placeholders.
 *
 * Notes:
 * - Our SQL is intentionally simple and does not embed `?` in strings.
 * - Keeping `?` in the route layer lets the same SQL run in SQLite and Postgres.
 */
const toPostgresPlaceholders = (sql) => {
  let index = 0;
  return String(sql).replace(/\?/g, () => `$${(index += 1)}`);
};

/**
 * Apply all SQL files in a directory to the database, in lexical order.
 */
const applySqlDirectory = async (db, directory) => {
  const files = readdirSync(directory)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const sql = readFileSync(resolve(directory, file), "utf8");
    // Migrations/seeds are static SQL with no placeholders; safe to execute as-is.
    // (Postgres will execute multi-statement strings in simple-query mode.)
    await db.exec(sql);
  }
};

/**
 * Read the fallback JSON catalog and insert rows into SQL tables when empty.
 *
 * This is a local-dev convenience and is disabled by default in production.
 */
const seedCatalogFromJson = async (db) => {
  const countRow = await db.queryOne(
    "SELECT COUNT(1) as count FROM products WHERE id NOT LIKE 'prod-seed-%'",
  );
  const count = Number(countRow?.count ?? 0);
  if (Number.isFinite(count) && count > 0) {
    return; // Skip when catalog rows already exist.
  }

  const catalogPath = resolve(process.cwd(), "src", "data", "products.json");
  if (!existsSync(catalogPath)) {
    return; // Skip when JSON catalog is unavailable.
  }

  const nowIso = new Date().toISOString();
  const raw = readFileSync(catalogPath, "utf8");
  const products = JSON.parse(raw);
  if (!Array.isArray(products)) {
    return;
  }

  const insertProductSql = `
    INSERT INTO products (
      id,
      slug,
      name,
      category,
      sub_category,
      retailer,
      price,
      original_price,
      rating,
      rating_count,
      description,
      affiliate_url,
      publish_state,
      created_at,
      updated_at
    ) VALUES (
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?
    )
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      name = excluded.name,
      category = excluded.category,
      sub_category = excluded.sub_category,
      retailer = excluded.retailer,
      price = excluded.price,
      original_price = excluded.original_price,
      rating = excluded.rating,
      rating_count = excluded.rating_count,
      description = excluded.description,
      affiliate_url = excluded.affiliate_url,
      publish_state = excluded.publish_state,
      updated_at = excluded.updated_at;
  `;

  const insertExtrasSql = `
    INSERT INTO product_extras (
      product_id,
      images_json,
      tags_json,
      video_url,
      deal_ends_at,
      save_count,
      blog_slug,
      blog_id,
      affiliate_verification_json,
      ad_creative_json,
      is_sponsored,
      source,
      external_id,
      last_seen_at,
      last_price_check_at
    ) VALUES (
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?
    )
    ON CONFLICT(product_id) DO UPDATE SET
      images_json = excluded.images_json,
      tags_json = excluded.tags_json,
      video_url = excluded.video_url,
      deal_ends_at = excluded.deal_ends_at,
      save_count = excluded.save_count,
      blog_slug = excluded.blog_slug,
      blog_id = excluded.blog_id,
      affiliate_verification_json = excluded.affiliate_verification_json,
      ad_creative_json = excluded.ad_creative_json,
      is_sponsored = excluded.is_sponsored,
      source = excluded.source,
      external_id = excluded.external_id,
      last_seen_at = excluded.last_seen_at,
      last_price_check_at = excluded.last_price_check_at;
  `;

  await db.transaction(async (tx) => {
    for (const product of products) {
      await tx.exec(insertProductSql, [
        product.id,
        product.slug,
        product.name,
        product.category,
        product.subCategory ?? "",
        product.retailer ?? "Retailer",
        product.price,
        product.originalPrice ?? null,
        product.rating ?? null,
        product.ratingCount ?? null,
        product.description ?? "",
        product.affiliateUrl ?? "",
        product.publishState ?? "published",
        product.createdAt ?? nowIso,
        product.updatedAt ?? nowIso,
      ]);

      await tx.exec(insertExtrasSql, [
        product.id,
        JSON.stringify(Array.isArray(product.images) ? product.images : []),
        product.tags ? JSON.stringify(product.tags) : null,
        product.videoUrl ?? null,
        product.dealEndsAt ?? null,
        typeof product.saveCount === "number" ? product.saveCount : null,
        product.blogSlug ?? null,
        product.blogId ?? null,
        product.affiliateVerification ? JSON.stringify(product.affiliateVerification) : null,
        product.adCreative ? JSON.stringify(product.adCreative) : null,
        product.isSponsored ? 1 : 0,
        product.source ?? null,
        product.externalId ?? null,
        product.lastSeenAt ?? null,
        product.lastPriceCheckAt ?? null,
      ]);
    }
  });
};

/**
 * Create a DB adapter for the Node SQLite driver.
 */
const openSqliteDatabase = ({ sqlitePath }) => {
  const rawDb = new DatabaseSync(sqlitePath);
  rawDb.exec("PRAGMA foreign_keys = ON;");
  rawDb.exec("PRAGMA journal_mode = WAL;");

  const db = {
    dialect: "sqlite",
    query: async (sql, params = []) => rawDb.prepare(sql).all(...params),
    queryOne: async (sql, params = []) => rawDb.prepare(sql).get(...params) ?? null,
    exec: async (sql, params = []) => {
      if (params.length === 0) {
        rawDb.exec(sql); // Supports multi-statement strings used by migrations/seeds.
        return;
      }

      rawDb.prepare(sql).run(...params);
    },
    transaction: async (fn) => {
      rawDb.exec("BEGIN");
      try {
        const result = await fn(db);
        rawDb.exec("COMMIT");
        return result;
      } catch (error) {
        rawDb.exec("ROLLBACK");
        throw error;
      }
    },
    close: async () => {
      rawDb.close?.();
    },
  };

  return db;
};

/**
 * Create a DB adapter for a Postgres database (Neon/Render/etc).
 */
const openPostgresDatabase = ({ databaseUrl }) => {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.WINDOW_SHOPPR_PG_POOL_MAX ?? "") || 10,
  });

  const execWithClient = async ({ client, sql, params }) => {
    const text = params.length > 0 ? toPostgresPlaceholders(sql) : sql;
    return client.query(text, params);
  };

  const db = {
    dialect: "postgres",
    query: async (sql, params = []) => {
      const result = await execWithClient({ client: pool, sql, params });
      return Array.isArray(result?.rows) ? result.rows : [];
    },
    queryOne: async (sql, params = []) => {
      const result = await execWithClient({ client: pool, sql, params });
      return Array.isArray(result?.rows) && result.rows.length > 0 ? result.rows[0] : null;
    },
    exec: async (sql, params = []) => {
      await execWithClient({ client: pool, sql, params });
    },
    transaction: async (fn) => {
      const client = await pool.connect();
      const tx = {
        dialect: "postgres",
        query: async (sql, params = []) => {
          const result = await execWithClient({ client, sql, params });
          return Array.isArray(result?.rows) ? result.rows : [];
        },
        queryOne: async (sql, params = []) => {
          const result = await execWithClient({ client, sql, params });
          return Array.isArray(result?.rows) && result.rows.length > 0 ? result.rows[0] : null;
        },
        exec: async (sql, params = []) => {
          await execWithClient({ client, sql, params });
        },
        transaction: async () => {
          throw new Error("Nested transactions are not supported.");
        },
        close: async () => undefined,
      };

      try {
        await client.query("BEGIN");
        const result = await fn(tx);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    close: async () => {
      await pool.end();
    },
  };

  return db;
};

/**
 * Open and initialize the database (migrations + seeds + optional JSON seeding).
 */
export const openDatabase = async ({ sqlitePath, databaseUrl, autoMigrate, seedFromJson }) => {
  const db =
    databaseUrl && databaseUrl.trim()
      ? openPostgresDatabase({ databaseUrl })
      : openSqliteDatabase({ sqlitePath });

  if (autoMigrate) {
    await applySqlDirectory(db, resolve(process.cwd(), "db", "migrations"));
    await applySqlDirectory(db, resolve(process.cwd(), "db", "seeds"));
  }

  if (seedFromJson) {
    await seedCatalogFromJson(db);
  }

  return db;
};
