import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Ensure custom-domain and SSL docs/config are present.
 */
test("custom domain artifacts exist", () => {
  assert.ok(existsSync(resolve(process.cwd(), "public/CNAME")));
  assert.ok(existsSync(resolve(process.cwd(), "docs/CUSTOM_DOMAIN_SSL.md")));
});

/**
 * Ensure CNAME is configured to a real custom domain (not github.io).
 */
test("CNAME contains custom apex domain", () => {
  const cname = readFileSync(resolve(process.cwd(), "public/CNAME"), "utf8").trim();
  assert.ok(cname.length > 0, "CNAME must not be empty");
  assert.ok(!cname.includes("github.io"), "CNAME must be a custom domain, not github.io");
  assert.match(cname, /^[a-z0-9.-]+$/i);
});

/**
 * Ensure SSL checklist exists in docs.
 */
test("SSL docs include enforcement and verification steps", () => {
  const doc = readFileSync(resolve(process.cwd(), "docs/CUSTOM_DOMAIN_SSL.md"), "utf8");
  assert.match(doc, /Enforce HTTPS/);
  assert.match(doc, /Certificate/);
  assert.match(doc, /Verification checklist/);
});
