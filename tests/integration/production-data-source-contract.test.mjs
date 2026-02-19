import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dataSource = readFileSync(resolve(process.cwd(), "src/shared/lib/catalog/data.ts"), "utf8");
const envSource = readFileSync(resolve(process.cwd(), "src/shared/lib/platform/env.ts"), "utf8");

/**
 * Ensure runtime deployments can disable JSON fallback and enforce SQL/API source.
 */
test("production data source enforcement contract exists", () => {
  assert.match(envSource, /NEXT_PUBLIC_ALLOW_JSON_FALLBACK/);
  assert.match(dataSource, /isJsonFallbackAllowed/);
  assert.match(dataSource, /SQL\/API catalog is required and JSON fallback is disabled/);
  assert.match(dataSource, /SQL\/API product detail is required and JSON fallback is disabled/);
});
