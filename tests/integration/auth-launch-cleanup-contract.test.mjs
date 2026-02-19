import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envSource = readFileSync(resolve(process.cwd(), "src/shared/lib/platform/env.ts"), "utf8");
const apiSource = readFileSync(resolve(process.cwd(), "src/shared/lib/platform/auth/api.ts"), "utf8");
const serviceSource = readFileSync(resolve(process.cwd(), "src/shared/lib/platform/auth/service.ts"), "utf8");
const guardSource = readFileSync(resolve(process.cwd(), "src/shared/lib/platform/auth/launch-guard.ts"), "utf8");

/**
 * Ensure launch auth cleanup guardrails are wired.
 */
test("auth launch cleanup guard exists and is enforced", () => {
  assert.match(envSource, /NEXT_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK/);
  assert.match(guardSource, /export const isLocalAuthFallbackAllowed/);
  assert.match(guardSource, /export const assertAuthBackendReady/);
  assert.match(apiSource, /assertAuthBackendReady\(/);
  assert.match(serviceSource, /isLocalAuthFallbackAllowed\(\)/);
});

/**
 * Ensure launch cleanup docs exist.
 */
test("auth launch cleanup docs exist", () => {
  assert.ok(existsSync(resolve(process.cwd(), "docs/AUTH_LAUNCH_CLEANUP.md")));
});
