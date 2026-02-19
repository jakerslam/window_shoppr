import { requestAuthApi } from "@/shared/lib/platform/auth/api";
import { buildLocalAccountId, normalizeEmail, readLocalAuthAccounts, writeLocalAuthAccounts } from "@/shared/lib/platform/auth/local-accounts";
import { logPrivilegedAuditEvent } from "@/shared/lib/platform/auth/audit-log";
import { AuthActionResult } from "@/shared/lib/platform/auth/types";
import { AuthProvider, AuthRole, clearAuthSession, readAuthSession, writeAuthSession } from "@/shared/lib/platform/auth-session";

const AUTH_PROVIDER_LABEL: Record<AuthProvider, string> = {
  email: "Email",
  google: "Google",
  x: "X",
  meta: "Meta",
};

/**
 * Persist an auth session payload and return the normalized stored session.
 */
const persistSession = ({
  provider,
  roles,
  email,
  displayName,
  marketingEmails,
}: {
  provider: AuthProvider;
  roles?: AuthRole[];
  email?: string;
  displayName?: string;
  marketingEmails?: boolean;
}): AuthActionResult => {
  writeAuthSession({ provider, roles, email, displayName, marketingEmails });
  const session = readAuthSession();
  if (!session) {
    return { ok: false, message: "Unable to persist authenticated session." };
  }

  return { ok: true, session, source: "local" };
};

/**
 * Sign in with email + password against API first, then local fallback.
 */
export const signInWithEmail = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthActionResult> => {
  const normalizedEmail = normalizeEmail(email);
  const apiResult = await requestAuthApi({
    path: "/auth/login",
    body: { email: normalizedEmail, password },
  });
  if (apiResult) {
    return apiResult;
  }

  const account = readLocalAuthAccounts().find(
    (candidate) =>
      candidate.provider === "email" &&
      candidate.email === normalizedEmail &&
      candidate.password === password,
  );
  if (!account) {
    return { ok: false, message: "Invalid email or password." };
  }

  return persistSession({
    provider: "email",
    roles: account.roles ?? ["user"],
    email: account.email,
    displayName: account.displayName,
    marketingEmails: account.marketingEmails,
  });
};

/**
 * Create an account with email + password against API first, then local fallback.
 */
export const signUpWithEmail = async ({
  email,
  password,
  displayName,
  marketingEmails,
}: {
  email: string;
  password: string;
  displayName?: string;
  marketingEmails: boolean;
}): Promise<AuthActionResult> => {
  const normalizedEmail = normalizeEmail(email);
  const apiResult = await requestAuthApi({
    path: "/auth/signup",
    body: {
      email: normalizedEmail,
      password,
      displayName: displayName?.trim() || undefined,
      marketingEmails,
    },
  });
  if (apiResult) {
    return apiResult;
  }

  const accounts = readLocalAuthAccounts();
  if (accounts.some((candidate) => candidate.email === normalizedEmail)) {
    return { ok: false, message: "An account with that email already exists." };
  }

  const nowIso = new Date().toISOString();
  const roleSeed: AuthRole[] = accounts.length === 0 ? ["admin"] : ["user"]; // First local account is admin for bootstrapping.
  const createdAccount = {
    id: buildLocalAccountId(),
    email: normalizedEmail,
    password,
    displayName: displayName?.trim() || undefined,
    marketingEmails,
    provider: "email" as const,
    roles: roleSeed,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  writeLocalAuthAccounts([...accounts, createdAccount]);

  return persistSession({
    provider: "email",
    roles: createdAccount.roles,
    email: createdAccount.email,
    displayName: createdAccount.displayName,
    marketingEmails: createdAccount.marketingEmails,
  });
};

/**
 * Sign in with a social provider against API first, then local fallback.
 */
export const signInWithProvider = async ({
  provider,
}: {
  provider: Exclude<AuthProvider, "email">;
}): Promise<AuthActionResult> => {
  const apiResult = await requestAuthApi({
    path: "/auth/social",
    body: { provider },
  });
  if (apiResult) {
    return apiResult;
  }

  const accounts = readLocalAuthAccounts();
  const fallbackEmail = `${provider}@window-shoppr.local`;
  const existingAccount = accounts.find((candidate) => candidate.email === fallbackEmail);
  if (!existingAccount) {
    const nowIso = new Date().toISOString();
    accounts.push({
      id: buildLocalAccountId(),
      email: fallbackEmail,
      displayName: `${AUTH_PROVIDER_LABEL[provider]} user`,
      marketingEmails: false,
      provider,
      roles: ["user"],
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    writeLocalAuthAccounts(accounts);
  }

  const account = accounts.find((candidate) => candidate.email === fallbackEmail);
  return persistSession({
    provider,
    roles: account?.roles ?? ["user"],
    email: account?.email,
    displayName: account?.displayName,
    marketingEmails: account?.marketingEmails,
  });
};

/**
 * Sign out from API (when configured) and clear local session state.
 */
export const signOutAccount = async () => {
  const session = readAuthSession();
  await requestAuthApi({
    path: "/auth/logout",
    body: {},
  }); // Fire-and-forget API logout when backend auth is configured.
  clearAuthSession(); // Always clear local session to finalize sign-out.
  await logPrivilegedAuditEvent({
    action: "auth.logout",
    status: "allowed",
    session,
    metadata: { provider: session?.provider ?? "unknown" },
  }); // Track session termination events for auth audit trails.
};
