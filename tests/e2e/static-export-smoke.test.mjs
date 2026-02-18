import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT_DIR = resolve(process.cwd(), "out");
const productsPath = resolve(process.cwd(), "src/data/products.json");
const products = JSON.parse(readFileSync(productsPath, "utf8"));
const smokeSlug = products[0]?.slug ?? "cozy-cloud-throw-blanket";

/**
 * Load an exported route HTML file from out/.
 */
const readExportedRoute = (routePath) => {
  const normalized = routePath.replace(/^\/+/, "");
  const filePath =
    normalized.length === 0
      ? resolve(OUT_DIR, "index.html")
      : resolve(OUT_DIR, normalized, "index.html");

  assert.ok(existsSync(filePath), `missing exported route HTML: ${routePath}`);
  return readFileSync(filePath, "utf8");
};

/**
 * Confirm core pages render in the exported artifact.
 */
test("e2e smoke: exported shell routes exist", () => {
  assert.ok(existsSync(OUT_DIR), "out/ not found. Run `npm run build` before e2e tests.");

  const homeHtml = readExportedRoute("/");
  assert.match(homeHtml, /window shoppr/i, "home route missing expected brand text");

  const wishlistHtml = readExportedRoute("/wishlist");
  assert.match(wishlistHtml, /wishlist/i, "wishlist route missing expected label");

  const loginHtml = readExportedRoute("/login");
  assert.match(loginHtml, /sign in/i, "login route missing expected label");

  const productHtml = readExportedRoute(`/product/${smokeSlug}`);
  assert.match(productHtml, /get deal/i, "product route missing expected CTA text");
});
