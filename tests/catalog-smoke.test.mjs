import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const productsPath = resolve(process.cwd(), "src/data/products.json");
const products = JSON.parse(readFileSync(productsPath, "utf8"));

/**
 * Find duplicate string values in an array.
 */
const findDuplicates = (values) => {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }

    seen.add(value);
  });

  return [...duplicates];
};

/**
 * Ensure the local fallback catalog is present.
 */
test("catalog contains products", () => {
  assert.ok(Array.isArray(products), "products.json must contain an array");
  assert.ok(products.length > 0, "products.json must contain at least one product");
});

/**
 * Ensure product identity fields remain unique.
 */
test("catalog ids and slugs are unique", () => {
  const duplicateIds = findDuplicates(products.map((product) => product.id));
  const duplicateSlugs = findDuplicates(products.map((product) => product.slug));

  assert.equal(duplicateIds.length, 0, `duplicate ids: ${duplicateIds.join(", ")}`);
  assert.equal(duplicateSlugs.length, 0, `duplicate slugs: ${duplicateSlugs.join(", ")}`);
});

/**
 * Ensure deal pricing invariants remain valid.
 */
test("catalog prices are valid", () => {
  products.forEach((product) => {
    assert.equal(typeof product.price, "number", `price must be number for ${product.id}`);
    assert.ok(product.price >= 0, `price must be non-negative for ${product.id}`);

    if (typeof product.originalPrice === "number") {
      assert.ok(
        product.originalPrice >= product.price,
        `originalPrice must be >= price for ${product.id}`,
      );
    }
  });
});

/**
 * Ensure deal expiration dates remain parseable.
 */
test("deal end timestamps are parseable when present", () => {
  products.forEach((product) => {
    if (!product.dealEndsAt) {
      return;
    }

    const parsed = new Date(product.dealEndsAt);
    assert.ok(
      Number.isFinite(parsed.getTime()),
      `dealEndsAt must be parseable for ${product.id}`,
    );
  });
});

