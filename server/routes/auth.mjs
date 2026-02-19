import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { writeApiError, writeApiOk, shortHash } from "../utils.mjs";

const EMAIL_SCHEMA = z.string().trim().toLowerCase().email();
const PASSWORD_SCHEMA = z.string().min(6).max(200);
const PROVIDER_SCHEMA = z.enum(["email", "google", "x", "meta"]);

/**
 * Create a password hash string using scrypt with a random salt.
 */
const hashPassword = (password) => {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
};

/**
 * Verify a password against a stored scrypt hash.
 */
const verifyPassword = (password, stored) => {
  if (typeof stored !== "string") {
    return false;
  }

  const [scheme, saltHex, keyHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  const derived = scryptSync(password, salt, expected.length);
  return timingSafeEqual(derived, expected);
};

/**
 * Create and persist a backend session token for an authenticated account.
 */
const createAuthSession = ({ db, accountId }) => {
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  const sessionToken = `st_${randomBytes(24).toString("hex")}`;
  const sessionId = `sess_${shortHash(`${accountId}:${sessionToken}:${nowIso}`)}`;

  db.prepare(
    `INSERT INTO auth_sessions (id, account_id, session_token, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       session_token = excluded.session_token,
       created_at = excluded.created_at,
       expires_at = excluded.expires_at;`,
  ).run(sessionId, accountId, sessionToken, nowIso, expiresAt);

  return { sessionId, expiresAt };
};

/**
 * Handle POST /auth/signup.
 */
export const handleAuthSignup = async ({ db, body, res }) => {
  const parsed = z
    .object({
      email: EMAIL_SCHEMA,
      password: PASSWORD_SCHEMA,
      displayName: z.string().trim().min(1).max(80).optional(),
      marketingEmails: z.boolean().optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    writeApiError(res, 400, "Invalid signup payload.");
    return;
  }

  const nowIso = new Date().toISOString();
  const existing = db
    .prepare(`SELECT id FROM accounts WHERE provider = 'email' AND email = ?`)
    .get(parsed.data.email);
  if (existing?.id) {
    writeApiError(res, 409, "An account with that email already exists.");
    return;
  }

  const firstAccountRow = db.prepare("SELECT COUNT(1) as count FROM accounts").get();
  const isFirstAccount =
    typeof firstAccountRow?.count === "number" ? firstAccountRow.count === 0 : false;
  const rolesJson = JSON.stringify(isFirstAccount ? ["admin"] : ["user"]);
  const accountId = `acct_${shortHash(`email:${parsed.data.email}`)}`;
  const passwordHash = hashPassword(parsed.data.password);

  db.prepare(
    `INSERT INTO accounts (
      id,
      provider,
      email,
      password_hash,
      display_name,
      marketing_emails,
      roles_json,
      created_at,
      updated_at
    ) VALUES (?, 'email', ?, ?, ?, ?, ?, ?, ?);`,
  ).run(
    accountId,
    parsed.data.email,
    passwordHash,
    parsed.data.displayName ?? null,
    parsed.data.marketingEmails ? 1 : 0,
    rolesJson,
    nowIso,
    nowIso,
  );

  const { sessionId, expiresAt } = createAuthSession({ db, accountId });

  writeApiOk(res, {
    session: {
      provider: "email",
      roles: JSON.parse(rolesJson),
      email: parsed.data.email,
      displayName: parsed.data.displayName ?? undefined,
      marketingEmails: Boolean(parsed.data.marketingEmails),
      sessionId,
      expiresAt,
    },
  });
};

/**
 * Handle POST /auth/login.
 */
export const handleAuthLogin = async ({ db, body, res }) => {
  const parsed = z
    .object({
      email: EMAIL_SCHEMA,
      password: PASSWORD_SCHEMA,
    })
    .safeParse(body);

  if (!parsed.success) {
    writeApiError(res, 400, "Invalid login payload.");
    return;
  }

  const account = db
    .prepare(
      `SELECT id, password_hash, display_name, marketing_emails, roles_json
       FROM accounts WHERE provider = 'email' AND email = ?`,
    )
    .get(parsed.data.email);

  if (!account?.id || !verifyPassword(parsed.data.password, account.password_hash)) {
    writeApiError(res, 401, "Invalid email or password.");
    return;
  }

  const { sessionId, expiresAt } = createAuthSession({ db, accountId: account.id });
  const roles = (() => {
    try {
      const parsedRoles = JSON.parse(account.roles_json ?? "[]");
      return Array.isArray(parsedRoles) && parsedRoles.length > 0 ? parsedRoles : ["user"];
    } catch {
      return ["user"];
    }
  })();

  writeApiOk(res, {
    session: {
      provider: "email",
      roles,
      email: parsed.data.email,
      displayName: account.display_name ?? undefined,
      marketingEmails: Boolean(account.marketing_emails),
      sessionId,
      expiresAt,
    },
  });
};

/**
 * Handle POST /auth/social.
 */
export const handleAuthSocial = async ({ db, body, res }) => {
  const parsed = z
    .object({
      provider: PROVIDER_SCHEMA,
    })
    .safeParse(body);

  if (!parsed.success || parsed.data.provider === "email") {
    writeApiError(res, 400, "Invalid social auth payload.");
    return;
  }

  const provider = parsed.data.provider;
  const nowIso = new Date().toISOString();
  const accountId = `acct_${shortHash(`provider:${provider}`)}`;

  const existing = db
    .prepare("SELECT id, display_name, marketing_emails, roles_json FROM accounts WHERE id = ?")
    .get(accountId);
  if (!existing?.id) {
    db.prepare(
      `INSERT INTO accounts (
        id,
        provider,
        email,
        password_hash,
        display_name,
        marketing_emails,
        roles_json,
        created_at,
        updated_at
      ) VALUES (?, ?, NULL, NULL, ?, 0, '["user"]', ?, ?);`,
    ).run(accountId, provider, `${provider.toUpperCase()} user`, nowIso, nowIso);
  }

  const account = db
    .prepare("SELECT display_name, marketing_emails, roles_json FROM accounts WHERE id = ?")
    .get(accountId);

  const roles = (() => {
    try {
      const parsedRoles = JSON.parse(account?.roles_json ?? "[]");
      return Array.isArray(parsedRoles) && parsedRoles.length > 0 ? parsedRoles : ["user"];
    } catch {
      return ["user"];
    }
  })();

  const { sessionId, expiresAt } = createAuthSession({ db, accountId });

  writeApiOk(res, {
    session: {
      provider,
      roles,
      displayName: account?.display_name ?? `${provider.toUpperCase()} user`,
      marketingEmails: Boolean(account?.marketing_emails),
      sessionId,
      expiresAt,
    },
  });
};

/**
 * Handle POST /auth/logout.
 */
export const handleAuthLogout = async ({ res }) => {
  writeApiOk(res, { ok: true });
};
