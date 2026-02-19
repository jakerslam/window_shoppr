import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const uploadPolicyPath = resolve(
  process.cwd(),
  "src/shared/lib/platform/upload-security.ts",
);
const uploadPolicyDocPath = resolve(
  process.cwd(),
  "docs/UPLOAD_SECURITY_POLICY.md",
);

const uploadPolicySource = readFileSync(uploadPolicyPath, "utf8");
const uploadPolicyDocSource = readFileSync(uploadPolicyDocPath, "utf8");

test("upload policy enforces deny-by-default and signed/quarantine requirements", () => {
  assert.match(uploadPolicySource, /enabled:\s*false/);
  assert.match(uploadPolicySource, /signedUrlRequired:\s*true/);
  assert.match(uploadPolicySource, /quarantineRequired:\s*true/);
  assert.match(uploadPolicySource, /validateUploadMetadata/);
});

test("upload policy doc captures required controls", () => {
  assert.match(uploadPolicyDocSource, /Signed URL flow required/);
  assert.match(uploadPolicyDocSource, /Quarantine scanning required/);
  assert.match(uploadPolicyDocSource, /must not be publicly served until malware scan passes/);
});
