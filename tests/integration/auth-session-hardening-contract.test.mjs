import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const authSessionPath = resolve(process.cwd(), "src/shared/lib/platform/auth-session.ts");
const authStateHookPath = resolve(process.cwd(), "src/shared/lib/platform/useAuthSessionState.ts");
const authHardeningDocPath = resolve(process.cwd(), "docs/AUTH_HARDENING.md");

const authSessionSource = readFileSync(authSessionPath, "utf8");
const authStateHookSource = readFileSync(authStateHookPath, "utf8");
const authHardeningDocSource = readFileSync(authHardeningDocPath, "utf8");

test("auth session enforces idle and absolute timeout policies", () => {
  assert.match(authSessionSource, /AUTH_IDLE_TIMEOUT_MS/);
  assert.match(authSessionSource, /AUTH_ABSOLUTE_TIMEOUT_MS/);
  assert.match(authSessionSource, /now - issuedAtMs > AUTH_ABSOLUTE_TIMEOUT_MS/);
  assert.match(authSessionSource, /now - updatedAtMs > AUTH_IDLE_TIMEOUT_MS/);
});

test("auth session exposes activity touch and rotation behavior", () => {
  assert.match(authSessionSource, /touchAuthSessionActivity/);
  assert.match(authSessionSource, /shouldRotateSessionId/);
  assert.match(authStateHookSource, /touchAuthSessionActivity/);
});

test("auth hardening doc includes idle/absolute timeout controls", () => {
  assert.match(authHardeningDocSource, /Idle timeout invalidation/);
  assert.match(authHardeningDocSource, /Absolute timeout invalidation/);
});
