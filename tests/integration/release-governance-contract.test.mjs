import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Ensure release strategy artifacts are present and contain required sections.
 */
test("release strategy docs and workflows are present", () => {
  const requiredFiles = [
    "docs/RELEASE_STRATEGY.md",
    "docs/RELEASE_CHECKLIST.md",
    ".github/workflows/release-pipeline.yml",
    "scripts/release-smoke.mjs",
    ".github/workflows/vercel-deploy.yml",
    "docs/HOSTING_PIPELINE.md",
    "vercel.json",
  ];

  requiredFiles.forEach((file) => {
    assert.ok(existsSync(resolve(process.cwd(), file)), `missing required file: ${file}`);
  });

  const strategy = readFileSync(resolve(process.cwd(), "docs/RELEASE_STRATEGY.md"), "utf8");
  assert.match(strategy, /## Environments/);
  assert.match(strategy, /## Release workflow/);
  assert.match(strategy, /## Rollback policy/);
});
