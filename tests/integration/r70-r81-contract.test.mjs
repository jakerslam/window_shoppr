import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");

test("R70 high-risk safeguards policy exists", () => {
  const source = read("src/shared/lib/platform/high-risk-actions.ts");
  assert.match(source, /HighRiskAction/);
  assert.match(source, /mode: "two_step"/);
  assert.match(source, /mode: "approval_required"/);
  assert.match(source, /requiresAudit: true/);
});

test("R71 backup/restore drill artifacts exist", () => {
  assert.equal(existsSync(resolve(process.cwd(), "docs/BACKUP_RESTORE_DRILL.md")), true);
  const source = read("scripts/check-backup-restore-readiness.mjs");
  assert.match(source, /RTO/);
  assert.match(source, /RPO/);
});

test("R72 supply-chain hardening artifacts exist", () => {
  assert.equal(existsSync(resolve(process.cwd(), "docs/SUPPLY_CHAIN_HARDENING.md")), true);
  const source = read("scripts/check-supply-chain-hardening.mjs");
  assert.match(source, /package-lock\.json/);
});

test("R73 threat model gate artifacts exist", () => {
  assert.equal(existsSync(resolve(process.cwd(), "docs/THREAT_MODEL.md")), true);
  const source = read("scripts/check-threat-model-gate.mjs");
  assert.match(source, /Threat model missing section/);
});

test("R74 cost/performance guardrail artifacts exist", () => {
  assert.equal(existsSync(resolve(process.cwd(), "docs/COST_PERFORMANCE_GUARDRAILS.md")), true);
  const source = read("scripts/check-cost-performance-guardrails.mjs");
  assert.match(source, /categories:performance/);
});

test("R75 migration rehearsal artifacts exist", () => {
  assert.equal(existsSync(resolve(process.cwd(), "docs/MIGRATION_REHEARSAL.md")), true);
  const source = read("scripts/check-migration-rehearsal.mjs");
  assert.match(source, /migrations/);
});

test("R76 contract drift prevention artifacts exist", () => {
  assert.equal(existsSync(resolve(process.cwd(), "docs/API_CONTRACT_DRIFT.md")), true);
  const source = read("scripts/check-api-contract-drift.mjs");
  assert.match(source, /openapi-agent\.json/);
});

test("R77 feature-flag lifecycle artifacts exist", () => {
  const registry = read("src/shared/lib/platform/feature-flag-registry.ts");
  assert.match(registry, /owner/);
  assert.match(registry, /expiresOn/);
});

test("R78 synthetic journey schedule exists", () => {
  const workflow = read(".github/workflows/synthetic-journeys.yml");
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /test:e2e/);
});

test("R79 local storage schema versioning exists", () => {
  const source = read("src/shared/lib/platform/local-storage-versioning.ts");
  assert.match(source, /LOCAL_STORAGE_SCHEMA_VERSION/);
  assert.match(source, /migrateLocalStorageSchema/);
});

test("R80 admin dashboard route exists with role gate", () => {
  const source = read("src/features/admin/AdminDashboard.tsx");
  assert.match(source, /roles\.includes\("admin"\)/);
  assert.equal(existsSync(resolve(process.cwd(), "src/app/admin/page.tsx")), true);
});

test("R81 moderation command surface exists with immutable audit hash chain", () => {
  const source = read("src/shared/lib/agent/moderation-commands.ts");
  assert.match(source, /previousHash/);
  assert.match(source, /toModerationAuditEvent/);
});
