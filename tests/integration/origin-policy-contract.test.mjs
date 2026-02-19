import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const repoRoot = process.cwd();
const readSource = (path) => readFileSync(join(repoRoot, path), "utf8");

test("environment contract includes allowlisted origins variable", () => {
  const envSource = readSource("src/shared/lib/platform/env.ts");
  const envExample = readSource(".env.example");
  assert.match(envSource, /NEXT_PUBLIC_ALLOWED_ORIGINS/);
  assert.match(envExample, /NEXT_PUBLIC_ALLOWED_ORIGINS=/);
});

test("data api mutation calls are guarded by origin policy", () => {
  const dataApi = readSource("src/shared/lib/platform/data-api.ts");
  const originPolicy = readSource("src/shared/lib/platform/origin-policy.ts");
  assert.match(dataApi, /canSendMutationFromCurrentOrigin/);
  assert.match(dataApi, /Request blocked by origin policy/);
  assert.match(originPolicy, /isOriginAllowed/);
});
