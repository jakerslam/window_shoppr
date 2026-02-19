import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const governanceSource = readFileSync(
  resolve(process.cwd(), "src/shared/lib/platform/data-governance.ts"),
  "utf8",
);
const bootstrapSource = readFileSync(
  resolve(process.cwd(), "src/shared/components/privacy/DataGovernanceBootstrap.tsx"),
  "utf8",
);

/**
 * Ensure governance module exposes retention and user-rights controls.
 */
test("data governance module exposes retention/export/delete controls", () => {
  assert.match(governanceSource, /export const DATA_RETENTION_RULES/);
  assert.match(governanceSource, /export const exportUserDataBundle/);
  assert.match(governanceSource, /export const deleteUserDataBundle/);
  assert.match(governanceSource, /export const pruneExpiredGovernanceData/);
});

/**
 * Ensure retention cleanup is executed during app bootstrap.
 */
test("data governance bootstrap runs retention pruning", () => {
  assert.match(bootstrapSource, /pruneExpiredGovernanceData\(\)/);
});
