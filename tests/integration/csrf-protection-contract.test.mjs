import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const repoRoot = process.cwd();

const readSource = (path) => readFileSync(join(repoRoot, path), "utf8");

test("csrf helpers expose token + origin headers", () => {
  const csrfSource = readSource("src/shared/lib/platform/csrf.ts");
  assert.match(csrfSource, /x-csrf-token/);
  assert.match(csrfSource, /x-window-origin/);
  assert.match(csrfSource, /CSRF_TTL_MS/);
});

test("data-api mutation requests include csrf headers", () => {
  const dataApiSource = readSource("src/shared/lib/platform/data-api.ts");
  assert.match(dataApiSource, /isMutationMethod/);
  assert.match(dataApiSource, /getCsrfHeaders/);
  assert.match(dataApiSource, /method !== "GET"/);
});
