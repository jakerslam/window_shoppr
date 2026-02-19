import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Ensure environment template and docs exist.
 */
test("environment baseline artifacts exist", () => {
  assert.ok(existsSync(resolve(process.cwd(), ".env.example")));
  assert.ok(existsSync(resolve(process.cwd(), "docs/ENVIRONMENT.md")));
});

/**
 * Ensure .env example includes required keys for launch/deploy flows.
 */
test(".env.example contains required variable keys", () => {
  const envExample = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
  const requiredKeys = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_BASE_PATH",
    "NEXT_PUBLIC_DEPLOY_TARGET",
    "NEXT_PUBLIC_AUTH_API_URL",
    "NEXT_PUBLIC_DATA_API_URL",
    "NEXT_PUBLIC_MONITORING_API_URL",
    "NEXT_PUBLIC_SENTRY_DSN",
    "NEXT_PUBLIC_ALLOW_JSON_FALLBACK",
    "NEXT_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK",
    "NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG",
    "AGENT_API_KEY",
    "VERCEL_TOKEN",
    "VERCEL_ORG_ID",
    "VERCEL_PROJECT_ID",
  ];

  requiredKeys.forEach((key) => {
    assert.match(envExample, new RegExp(`^${key}=`, "m"), `missing ${key}`);
  });
});

/**
 * Ensure docs include profile guidance for local, pages beta, and production runtime.
 */
test("environment docs include profile-specific guidance", () => {
  const docs = readFileSync(resolve(process.cwd(), "docs/ENVIRONMENT.md"), "utf8");
  assert.match(docs, /## Environment profiles/);
  assert.match(docs, /### Local development/);
  assert.match(docs, /### GitHub Pages beta/);
  assert.match(docs, /### Production runtime/);
});
