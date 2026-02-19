import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const homeFeedSource = readFileSync(resolve(process.cwd(), "src/features/home-feed/HomeFeed.tsx"), "utf8");
const homePageSource = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");

/**
 * Ensure runtime modal routing is wired with URL query state.
 */
test("runtime modal routing contract exists", () => {
  assert.match(homeFeedSource, /PUBLIC_ENV\.deployTarget === "runtime"/);
  assert.match(homeFeedSource, /\/?\?product=\$\{encodeURIComponent\(product\.slug\)\}/);
  assert.match(homeFeedSource, /router\.push\(`\/product\/\$\{product\.slug\}\/`\)/);
  assert.match(homeFeedSource, /useSearchParams\(\)/);
  assert.match(homeFeedSource, /<Modal/);
  assert.match(homeFeedSource, /<ProductDetail product=\{modalProduct\} inModal \/>/);
  assert.match(homePageSource, /<HomeFeed products=\{products\} \/>/);
});

/**
 * Ensure modal routing documentation exists.
 */
test("modal routing documentation exists", () => {
  assert.ok(existsSync(resolve(process.cwd(), "docs/MODAL_ROUTING.md")));
});
