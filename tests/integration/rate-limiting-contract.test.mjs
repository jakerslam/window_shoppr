import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const repoRoot = process.cwd();

const readSource = (path) =>
  readFileSync(join(repoRoot, path), "utf8");

test("rate-limit primitive exposes 429-compatible contract and violation reporting", () => {
  const source = readSource("src/shared/lib/platform/rate-limit.ts");
  assert.match(source, /statusCode:\s*429/);
  assert.match(source, /retryAfterMs/);
  assert.match(source, /reportErrorEvent/);
  assert.match(source, /idempotencyKey/);
});

test("write endpoints consume the shared abuse guard", () => {
  const dealSubmission = readSource("src/shared/lib/engagement/deal-submissions.ts");
  const comments = readSource("src/shared/lib/engagement/comments.ts");
  const reports = readSource("src/shared/lib/engagement/reports.ts");
  const email = readSource("src/shared/lib/engagement/email.ts");

  assert.match(dealSubmission, /consumeRateLimit/);
  assert.match(comments, /consumeRateLimit/);
  assert.match(reports, /consumeRateLimit/);
  assert.match(email, /consumeRateLimit/);
});
