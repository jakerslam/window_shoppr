import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { SERVER_CONFIG } from "../config.mjs";
import { writeApiError, writeApiOk, shortHash } from "../utils.mjs";

const EMAIL_SCHEMA = z.string().trim().toLowerCase().email();
const PASSWORD_SCHEMA = z.string().min(6).max(200);
const PROVIDER_SCHEMA = z.enum(["email", "google", "x", "meta"]);

/**
 * Parse a cookie header into key/value pairs (best-effort, RFC-lite).
 */
const parseCookies = (raw) => {
  if (typeof raw !== "string" || !raw.trim()) {
    return {};
  }

  return raw.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) {
      return acc;
    }

    const value = rest.join("=");
    if (!value) {
      return acc;
    }

    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
};

/**
 * Read the auth-session token from the request cookie header.
 */
const readSessionTokenFromCookie = (req) => {
  const cookieHeader = req?.headers?.cookie;
  const cookies = parseCookies(cookieHeader);
  const name = SERVER_CONFIG.sessionCookie.name;
  const token = cookies[name];
  return typeof token === "string" && token.trim() ? token.trim() : null;
};

/**
 * Serialize a session cookie with hardened defaults.
 */
const buildSessionCookie = ({ token, expiresAt }) => {
  const { name, domain, sameSite, secure } = SERVER_CONFIG.sessionCookie;
  const attributes = [
    `${name}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${sameSite || "Lax"}`,
  ];

  if (domain) {
    attributes.push(`Domain=${domain}`);
  }

  if (expiresAt) {
    attributes.push(`Expires=${new Date(expiresAt).toUTCString()}`);
  }

  if (secure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
};

/**
 * Clear the session cookie explicitly.
 */
const buildClearedSessionCookie = () => {
  const { name, domain, sameSite, secure } = SERVER_CONFIG.sessionCookie;
  const attributes = [
    `${name}=`,
    "Path=/",
    "HttpOnly",
    `SameSite=${sameSite || "Lax"}`,
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
  ];

  if (domain) {
    attributes.push(`Domain=${domain}`);
  }

  if (secure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
};

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
const createAuthSession = async ({ db, accountId }) => {
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  const sessionToken = `st_${randomBytes(24).toString("hex")}`;
  const sessionId = `sess_${shortHash(`${accountId}:${sessionToken}:${nowIso}`)}`;

  await db.exec(
    `INSERT INTO auth_sessions (id, account_id, session_token, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       session_token = excluded.session_token,
       created_at = excluded.created_at,
       expires_at = excluded.expires_at;`,
    [sessionId, accountId, sessionToken, nowIso, expiresAt],
  );

  return { sessionToken, expiresAt };
};

/**
 * Resolve active session context from a session token.
 */
const readActiveSessionContext = async ({ db, sessionToken }) => {
  const row = await db.queryOne(
    `SELECT
      s.account_id,
      s.session_token,
      s.expires_at,
      s.revoked_at,
      a.provider,
      a.email,
      a.display_name,
      a.marketing_emails,
      a.roles_json
    FROM auth_sessions s
    INNER JOIN accounts a ON a.id = s.account_id
    WHERE s.session_token = ?
    LIMIT 1;`,
    [sessionToken],
  );

  if (!row?.session_token) {
    return null;
  }

  if (row.revoked_at) {
    return null;
  }

  const expiresAtMs = new Date(row.expires_at).getTime();
  if (Number.isFinite(expiresAtMs) && expiresAtMs < Date.now()) {
    return null;
  }

  const roles = (() => {
    try {
      const parsedRoles = JSON.parse(row.roles_json ?? "[]");
      return Array.isArray(parsedRoles) && parsedRoles.length > 0 ? parsedRoles : ["user"];
    } catch {
      return ["user"];
    }
  })();

  return {
    provider: row.provider,
    roles,
    email: row.email ?? undefined,
    displayName: row.display_name ?? undefined,
    marketingEmails: Boolean(row.marketing_emails),
    expiresAt: row.expires_at,
  };
};

/**
 * Resolve a response-safe session payload from active session context.
 */
const readActiveSession = async ({ db, sessionToken }) => {
  const context = await readActiveSessionContext({ db, sessionToken });
  if (!context) {
    return null;
  }

  return {
    provider: context.provider,
    roles: context.roles,
    email: context.email,
    displayName: context.displayName,
    marketingEmails: context.marketingEmails,
    expiresAt: context.expiresAt,
  };
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
  const existing = await db.queryOne(
    `SELECT id FROM accounts WHERE provider = 'email' AND email = ?`,
    [parsed.data.email],
  );
  if (existing?.id) {
    writeApiError(res, 409, "An account with that email already exists.");
    return;
  }

  const firstAccountRow = await db.queryOne("SELECT COUNT(1) as count FROM accounts");
  const isFirstAccount = Number(firstAccountRow?.count ?? 0) === 0;
  const rolesJson = JSON.stringify(isFirstAccount ? ["admin"] : ["user"]);
  const accountId = `acct_${shortHash(`email:${parsed.data.email}`)}`;
  const passwordHash = hashPassword(parsed.data.password);

  await db.exec(
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
    [
      accountId,
      parsed.data.email,
      passwordHash,
      parsed.data.displayName ?? null,
      parsed.data.marketingEmails ? 1 : 0,
      rolesJson,
      nowIso,
      nowIso,
    ],
  );

  const { sessionToken, expiresAt } = await createAuthSession({ db, accountId });
  res.setHeader("set-cookie", buildSessionCookie({ token: sessionToken, expiresAt }));

  writeApiOk(res, {
    session: {
      provider: "email",
      roles: JSON.parse(rolesJson),
      email: parsed.data.email,
      displayName: parsed.data.displayName ?? undefined,
      marketingEmails: Boolean(parsed.data.marketingEmails),
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

  const account = await db.queryOne(
    `SELECT id, password_hash, display_name, marketing_emails, roles_json
     FROM accounts WHERE provider = 'email' AND email = ?`,
    [parsed.data.email],
  );

  if (!account?.id || !verifyPassword(parsed.data.password, account.password_hash)) {
    writeApiError(res, 401, "Invalid email or password.");
    return;
  }

  const { sessionToken, expiresAt } = await createAuthSession({ db, accountId: account.id });
  res.setHeader("set-cookie", buildSessionCookie({ token: sessionToken, expiresAt }));
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

  const existing = await db.queryOne(
    "SELECT id, display_name, marketing_emails, roles_json FROM accounts WHERE id = ?",
    [accountId],
  );
  if (!existing?.id) {
    await db.exec(
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
      [accountId, provider, `${provider.toUpperCase()} user`, nowIso, nowIso],
    );
  }

  const account = await db.queryOne(
    "SELECT display_name, marketing_emails, roles_json FROM accounts WHERE id = ?",
    [accountId],
  );

  const roles = (() => {
    try {
      const parsedRoles = JSON.parse(account?.roles_json ?? "[]");
      return Array.isArray(parsedRoles) && parsedRoles.length > 0 ? parsedRoles : ["user"];
    } catch {
      return ["user"];
    }
  })();

  const { sessionToken, expiresAt } = await createAuthSession({ db, accountId });
  res.setHeader("set-cookie", buildSessionCookie({ token: sessionToken, expiresAt }));

  writeApiOk(res, {
    session: {
      provider,
      roles,
      displayName: account?.display_name ?? `${provider.toUpperCase()} user`,
      marketingEmails: Boolean(account?.marketing_emails),
      expiresAt,
    },
  });
};

/**
 * Handle POST /auth/logout.
 */
export const handleAuthLogout = async ({ db, req, res }) => {
  const sessionToken = readSessionTokenFromCookie(req);
  if (sessionToken) {
    await db.exec(
      `UPDATE auth_sessions
       SET revoked_at = ?
       WHERE session_token = ? AND revoked_at IS NULL;`,
      [new Date().toISOString(), sessionToken],
    );
  }

  res.setHeader("set-cookie", buildClearedSessionCookie());
  writeApiOk(res, { ok: true });
};

/**
 * Handle GET /auth/session.
 */
export const handleAuthSession = async ({ db, req, res }) => {
  res.setHeader("cache-control", "no-store"); // Never cache user sessions.

  const sessionToken = readSessionTokenFromCookie(req);
  if (!sessionToken) {
    writeApiError(res, 401, "Not authenticated.");
    return;
  }

  const session = await readActiveSession({ db, sessionToken });
  if (!session?.provider) {
    res.setHeader("set-cookie", buildClearedSessionCookie());
    writeApiError(res, 401, "Not authenticated.");
    return;
  }

  writeApiOk(res, { session });
};

/**
 * Handle PATCH /auth/account.
 */
export const handleAuthAccount = async ({ db, req, body, res }) => {
  const parsed = z
    .object({
      displayName: z.string().trim().min(1).max(80).optional(),
      marketingEmails: z.boolean().optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    writeApiError(res, 400, "Invalid account update payload.");
    return;
  }

  if (
    typeof parsed.data.displayName === "undefined" &&
    typeof parsed.data.marketingEmails === "undefined"
  ) {
    writeApiError(res, 400, "No account changes provided.");
    return;
  }

  const sessionToken = readSessionTokenFromCookie(req);
  if (!sessionToken) {
    writeApiError(res, 401, "Not authenticated.");
    return;
  }

  const context = await readActiveSessionContext({ db, sessionToken });
  if (!context?.account_id) {
    res.setHeader("set-cookie", buildClearedSessionCookie());
    writeApiError(res, 401, "Not authenticated.");
    return;
  }

  const nextDisplayName =
    typeof parsed.data.displayName === "undefined"
      ? context.displayName ?? null
      : parsed.data.displayName;
  const nextMarketingEmails =
    typeof parsed.data.marketingEmails === "undefined"
      ? context.marketingEmails
      : parsed.data.marketingEmails;

  await db.exec(
    `UPDATE accounts
     SET display_name = ?, marketing_emails = ?, updated_at = ?
     WHERE id = ?;`,
    [
      nextDisplayName,
      nextMarketingEmails ? 1 : 0,
      new Date().toISOString(),
      context.account_id,
    ],
  );

  writeApiOk(res, {
    session: {
      provider: context.provider,
      roles: context.roles,
      email: context.email,
      displayName: nextDisplayName ?? undefined,
      marketingEmails: nextMarketingEmails,
      expiresAt: context.expiresAt,
    },
  });
};
