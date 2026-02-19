import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envSource = readFileSync(resolve(process.cwd(), "src/shared/lib/platform/env.ts"), "utf8");
const monitoringSource = readFileSync(resolve(process.cwd(), "src/shared/lib/engagement/monitoring.ts"), "utf8");
const reportingSource = readFileSync(resolve(process.cwd(), "src/shared/lib/engagement/error-reporting.ts"), "utf8");

/**
 * Ensure monitoring + error reporting adapters are wired and documented.
 */
test("monitoring reporting artifacts exist", () => {
  assert.ok(existsSync(resolve(process.cwd(), "docs/MONITORING_REPORTING.md")));
  assert.ok(existsSync(resolve(process.cwd(), "src/shared/lib/engagement/error-reporting.ts")));
});

/**
 * Ensure Sentry DSN env support and forwarding integration exist.
 */
test("sentry-compatible reporting contract is wired", () => {
  assert.match(envSource, /NEXT_PUBLIC_SENTRY_DSN/);
  assert.match(reportingSource, /getSentryStoreEndpoint/);
  assert.match(reportingSource, /x-sentry-auth/);
  assert.match(monitoringSource, /reportErrorEvent\(/);
});
