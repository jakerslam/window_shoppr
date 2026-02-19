import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const runtimeScriptPath = resolve(
  process.cwd(),
  "scripts/check-security-headers-runtime.mjs",
);
const workflowPath = resolve(
  process.cwd(),
  ".github/workflows/security-headers-runtime.yml",
);
const packageJsonPath = resolve(process.cwd(), "package.json");

const runtimeScriptSource = readFileSync(runtimeScriptPath, "utf8");
const workflowSource = readFileSync(workflowPath, "utf8");
const packageJsonSource = readFileSync(packageJsonPath, "utf8");

test("runtime header verification script checks required headers", () => {
  assert.match(runtimeScriptSource, /content-security-policy/);
  assert.match(runtimeScriptSource, /x-content-type-options/);
  assert.match(runtimeScriptSource, /cross-origin-opener-policy/);
  assert.match(runtimeScriptSource, /SECURITY_HEADERS_CHECK_URL/);
});

test("runtime header workflow is scheduled and strict", () => {
  assert.match(workflowSource, /schedule:/);
  assert.match(workflowSource, /SECURITY_HEADERS_CHECK_STRICT:\s*"true"/);
  assert.match(workflowSource, /SECURITY_HEADERS_CHECK_URL/);
});

test("package scripts expose runtime header check command", () => {
  assert.match(packageJsonSource, /"security:headers-runtime"/);
});
