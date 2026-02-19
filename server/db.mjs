import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Apply all SQL files in a directory to the database, in lexical order.
 */
const applySqlDirectory = (db, directory) => {
  const files = readdirSync(directory)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  files.forEach((file) => {
    const sql = readFileSync(resolve(directory, file), "utf8");
    db.exec(sql);
  });
};

/**
 * Read the fallback JSON catalog and insert rows into SQL tables when empty.
 */
const seedCatalogFromJson = (db) => {
  const countRow = db
    .prepare(
      "SELECT COUNT(1) as count FROM products WHERE id NOT LIKE 'prod-seed-%'",
    )
    .get(); // Ignore deterministic seed rows so dev mode still imports the full JSON catalog.
  const count = typeof countRow?.count === "number" ? countRow.count : 0;
  if (count > 0) {
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

  const insertProduct = db.prepare(`
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
  `);

  const insertExtras = db.prepare(`
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
  `);

  db.exec("BEGIN");
  try {
    products.forEach((product) => {
      insertProduct.run(
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
      );

      insertExtras.run(
        product.id,
        JSON.stringify(Array.isArray(product.images) ? product.images : []),
        product.tags ? JSON.stringify(product.tags) : null,
        product.videoUrl ?? null,
        product.dealEndsAt ?? null,
        typeof product.saveCount === "number" ? product.saveCount : null,
        product.blogSlug ?? null,
        product.blogId ?? null,
        product.affiliateVerification
          ? JSON.stringify(product.affiliateVerification)
          : null,
        product.adCreative ? JSON.stringify(product.adCreative) : null,
        product.isSponsored ? 1 : 0,
        product.source ?? null,
        product.externalId ?? null,
        product.lastSeenAt ?? null,
        product.lastPriceCheckAt ?? null,
      );
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

/**
 * Open and initialize the SQLite database (migrations + seeds).
 */
export const openDatabase = ({ sqlitePath }) => {
  const db = new DatabaseSync(sqlitePath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");

  applySqlDirectory(db, resolve(process.cwd(), "db", "migrations"));
  applySqlDirectory(db, resolve(process.cwd(), "db", "seeds"));
  seedCatalogFromJson(db);

  return db;
};
