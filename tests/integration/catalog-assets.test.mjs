import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const productsPath = resolve(process.cwd(), "src/data/products.json");
const products = JSON.parse(readFileSync(productsPath, "utf8"));

/**
 * Ensure local image references map to real public assets.
 */
test("local product media files exist under public", () => {
  products.forEach((product) => {
    const media = Array.isArray(product.images) ? product.images : [];
    media
      .filter((value) => typeof value === "string" && value.startsWith("/"))
      .forEach((localPath) => {
        const absolutePath = resolve(process.cwd(), "public", localPath.slice(1));
        assert.ok(
          existsSync(absolutePath),
          `missing local media file for ${product.id}: ${localPath}`,
        );
      });
  });
});

/**
 * Ensure products include category + retailer metadata used across feed and nav filtering.
 */
test("catalog entries contain required discovery metadata", () => {
  products.forEach((product) => {
    assert.equal(typeof product.category, "string", `category required for ${product.id}`);
    assert.ok(product.category.trim().length > 0, `category empty for ${product.id}`);

    assert.equal(
      typeof product.subCategory,
      "string",
      `subCategory required for ${product.id}`,
    );
    assert.ok(product.subCategory.trim().length > 0, `subCategory empty for ${product.id}`);

    assert.equal(typeof product.retailer, "string", `retailer required for ${product.id}`);
    assert.ok(product.retailer.trim().length > 0, `retailer empty for ${product.id}`);
  });
});
