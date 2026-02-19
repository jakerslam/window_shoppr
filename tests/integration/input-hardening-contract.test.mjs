import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const repoRoot = process.cwd();
const readSource = (path) => readFileSync(join(repoRoot, path), "utf8");

test("input hardening utility provides sanitize and validation helpers", () => {
  const source = readSource("src/shared/lib/platform/input-hardening.ts");
  assert.match(source, /sanitizeUserText/);
  assert.match(source, /validateDisplayName/);
  assert.match(source, /validateCommentBody/);
  assert.match(source, /validateEmailInput/);
});

test("user-generated write paths consume shared hardening helpers", () => {
  const comments = readSource("src/shared/lib/engagement/comments.ts");
  const reports = readSource("src/shared/lib/engagement/reports.ts");
  const submissions = readSource("src/shared/lib/engagement/deal-submissions.ts");
  const email = readSource("src/shared/lib/engagement/email.ts");

  assert.match(comments, /sanitizeUserText/);
  assert.match(comments, /validateCommentBody/);
  assert.match(reports, /sanitizeUserText/);
  assert.match(submissions, /sanitizeUserText/);
  assert.match(email, /validateEmailInput/);
});
