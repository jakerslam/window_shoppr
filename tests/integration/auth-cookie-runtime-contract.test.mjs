import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const authRoutesSource = readFileSync(
  resolve(process.cwd(), "server/routes/auth.mjs"),
  "utf8",
);
const serverIndexSource = readFileSync(
  resolve(process.cwd(), "server/index.mjs"),
  "utf8",
);
const authApiSource = readFileSync(
  resolve(process.cwd(), "src/shared/lib/platform/auth/api.ts"),
  "utf8",
);
const authStateHookSource = readFileSync(
  resolve(process.cwd(), "src/shared/lib/platform/useAuthSessionState.ts"),
  "utf8",
);
const envDocsSource = readFileSync(resolve(process.cwd(), "docs/ENVIRONMENT.md"), "utf8");

test("backend auth routes issue and clear HttpOnly session cookies", () => {
  assert.match(authRoutesSource, /HttpOnly/);
  assert.match(authRoutesSource, /buildSessionCookie/);
  assert.match(authRoutesSource, /buildClearedSessionCookie/);
  assert.match(authRoutesSource, /export const handleAuthSession/);
  assert.match(authRoutesSource, /export const handleAuthAccount/);
});

test("server routes expose runtime session/account endpoints", () => {
  assert.match(serverIndexSource, /pattern:\s*\/\^\\\/auth\\\/session\$\//);
  assert.match(serverIndexSource, /pattern:\s*\/\^\\\/auth\\\/account\$\//);
});

test("client auth API includes credentials and session bootstrap call", () => {
  assert.match(authApiSource, /credentials:\s*"include"/);
  assert.match(authApiSource, /requestAuthSessionFromApi/);
  assert.match(authApiSource, /\/auth\/session/);
});

test("auth session hook hydrates from backend session in runtime mode", () => {
  assert.match(authStateHookSource, /requestAuthSessionFromApi/);
  assert.match(authStateHookSource, /PUBLIC_ENV\.deployTarget === "runtime"/);
});

test("environment docs include session cookie variables", () => {
  assert.match(envDocsSource, /WINDOW_SHOPPR_SESSION_COOKIE_NAME/);
  assert.match(envDocsSource, /WINDOW_SHOPPR_SESSION_COOKIE_SECURE/);
});

