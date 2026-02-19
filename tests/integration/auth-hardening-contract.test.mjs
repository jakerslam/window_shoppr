import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const authSessionPath = resolve(process.cwd(), "src/shared/lib/platform/auth-session.ts");
const authorizationPath = resolve(process.cwd(), "src/shared/lib/platform/auth/authorization.ts");
const auditPath = resolve(process.cwd(), "src/shared/lib/platform/auth/audit-log.ts");
const ingestionPath = resolve(process.cwd(), "src/shared/lib/agent/ingestion.ts");

const authSessionSource = readFileSync(authSessionPath, "utf8");
const authorizationSource = readFileSync(authorizationPath, "utf8");
const auditSource = readFileSync(auditPath, "utf8");
const ingestionSource = readFileSync(ingestionPath, "utf8");

/**
 * Ensure sessions now carry explicit roles and expiry metadata.
 */
test("auth session model includes role and lifecycle fields", () => {
  assert.match(authSessionSource, /export type AuthRole = "user" \| "editor" \| "agent" \| "admin"/);
  assert.match(authSessionSource, /roles: AuthRole\[\];/);
  assert.match(authSessionSource, /sessionId: string;/);
  assert.match(authSessionSource, /issuedAt: string;/);
  assert.match(authSessionSource, /expiresAt: string;/);
});

/**
 * Ensure privileged authorization guard exists and is used by agent ingestion.
 */
test("privileged authorization guard is defined and wired into ingestion", () => {
  assert.match(authorizationSource, /export const assertPrivilegedSession/);
  assert.match(authorizationSource, /Unauthorized: authenticated session required/);
  assert.match(authorizationSource, /Forbidden: insufficient role/);
  assert.match(ingestionSource, /assertPrivilegedSession\(/);
});

/**
 * Ensure privileged operations emit auditable records.
 */
test("privileged audit logging is defined and invoked", () => {
  assert.match(auditSource, /export type PrivilegedAuditEntry/);
  assert.match(auditSource, /PRIVILEGED_AUDIT_STORAGE_KEY/);
  assert.match(auditSource, /export const logPrivilegedAuditEvent/);

  const requiredActions = [
    "agent.auth.session_role",
    "agent.auth.api_key",
    "agent.queue.product_upsert",
    "agent.queue.product_publish",
    "agent.queue.moderation_resolve",
    "agent.queue.signal_submission",
  ];

  requiredActions.forEach((action) => {
    assert.match(
      ingestionSource,
      new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `missing audit action: ${action}`,
    );
  });
});
