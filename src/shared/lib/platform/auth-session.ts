export type AuthProvider = "email" | "google" | "x" | "meta";
export type AuthRole = "user" | "editor" | "agent" | "admin";

export type AuthSession = {
  isAuthenticated: true;
  provider: AuthProvider;
  roles: AuthRole[];
  email?: string;
  displayName?: string;
  marketingEmails?: boolean;
  sessionId: string;
  issuedAt: string;
  expiresAt: string;
  updatedAt: string;
};

export const AUTH_SESSION_STORAGE_KEY = "window_shoppr_auth_session"; // Local storage key for auth session stubs.
const AUTH_IDLE_TIMEOUT_MS = 1000 * 60 * 60 * 2; // Invalidate sessions idle for 2 hours.
const AUTH_ABSOLUTE_TIMEOUT_MS = 1000 * 60 * 60 * 24 * 14; // Hard cap session lifetime at 14 days.

/**
 * Normalize raw storage payloads into a safe auth session shape.
 */
const normalizeAuthSession = (input: unknown): AuthSession | null => {
  if (!input || typeof input !== "object") {
    return null; // Ignore malformed payloads.
  }

  const parsed = input as Partial<AuthSession>;
  if (parsed.isAuthenticated !== true || typeof parsed.updatedAt !== "string") {
    return null; // Ignore malformed payloads.
  }

  const provider = parsed.provider;
  if (provider !== "email" && provider !== "google" && provider !== "x" && provider !== "meta") {
    return null; // Ignore unknown providers.
  }

  return {
    isAuthenticated: true,
    provider,
    roles: Array.isArray(parsed.roles) && parsed.roles.length > 0
      ? parsed.roles.filter(
        (role): role is AuthRole =>
          role === "user" || role === "editor" || role === "agent" || role === "admin",
      )
      : ["user"],
    email: typeof parsed.email === "string" ? parsed.email : undefined,
    displayName:
      typeof parsed.displayName === "string" ? parsed.displayName : undefined,
    marketingEmails:
      typeof parsed.marketingEmails === "boolean"
        ? parsed.marketingEmails
        : undefined,
    sessionId:
      typeof parsed.sessionId === "string" && parsed.sessionId.trim()
        ? parsed.sessionId
        : `sess_${Date.now().toString(36)}`,
    issuedAt:
      typeof parsed.issuedAt === "string" && parsed.issuedAt.trim()
        ? parsed.issuedAt
        : parsed.updatedAt,
    expiresAt:
      typeof parsed.expiresAt === "string" && parsed.expiresAt.trim()
        ? parsed.expiresAt
        : new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: parsed.updatedAt,
  };
};

/**
 * Read the current auth session from local storage.
 */
export const readAuthSession = (): AuthSession | null => {
  if (typeof window === "undefined") {
    return null; // Skip storage reads during SSR.
  }

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) {
      return null; // No local session.
    }

    const parsed = JSON.parse(raw) as unknown;
    const session = normalizeAuthSession(parsed);
    if (!session) {
      return null;
    }

    const now = Date.now();
    const expiresAtMs = new Date(session.expiresAt).getTime();
    const issuedAtMs = new Date(session.issuedAt).getTime();
    const updatedAtMs = new Date(session.updatedAt).getTime();

    if (
      (Number.isFinite(expiresAtMs) && expiresAtMs < now) ||
      (Number.isFinite(issuedAtMs) && now - issuedAtMs > AUTH_ABSOLUTE_TIMEOUT_MS) ||
      (Number.isFinite(updatedAtMs) && now - updatedAtMs > AUTH_IDLE_TIMEOUT_MS)
    ) {
      clearAuthSession(); // Clear expired sessions automatically.
      return null;
    }

    return session;
  } catch {
    return null; // Ignore parse failures.
  }
};

/**
 * Persist a stubbed auth session and broadcast updates to the current tab.
 */
export const writeAuthSession = ({
  provider,
  roles,
  email,
  displayName,
  marketingEmails,
  updatedAt,
  expiresAt,
}: {
  provider: AuthProvider;
  roles?: AuthRole[];
  email?: string;
  displayName?: string;
  marketingEmails?: boolean;
  updatedAt?: string;
  expiresAt?: string;
}) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  const issuedAt = new Date().toISOString();
  const payload: AuthSession = {
    isAuthenticated: true,
    provider,
    roles:
      roles && roles.length > 0
        ? roles.filter(
          (role): role is AuthRole =>
            role === "user" || role === "editor" || role === "agent" || role === "admin",
        )
        : ["user"],
    email: email?.trim() || undefined,
    displayName: displayName?.trim() || undefined,
    marketingEmails,
    sessionId: `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    issuedAt,
    expiresAt: expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: updatedAt ?? issuedAt,
  };

  try {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors to avoid blocking UI.
  }

  window.dispatchEvent(new CustomEvent("auth:session", { detail: payload }));
};

/**
 * Mark the current session as active and rotate identifiers after inactivity.
 */
export const touchAuthSessionActivity = () => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  const current = readAuthSession();
  if (!current) {
    return;
  }

  const now = new Date().toISOString();
  const updatedAtMs = new Date(current.updatedAt).getTime();
  const shouldRotateSessionId =
    Number.isFinite(updatedAtMs) && Date.now() - updatedAtMs > 1000 * 60 * 30; // Rotate id after 30 min inactivity.
  const payload: AuthSession = {
    ...current,
    updatedAt: now,
    sessionId: shouldRotateSessionId
      ? `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      : current.sessionId,
  };

  try {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures to avoid blocking UI.
  }

  window.dispatchEvent(new CustomEvent("auth:session", { detail: payload }));
};

/**
 * Clear the persisted auth session and broadcast sign-out in the current tab.
 */
export const clearAuthSession = () => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  try {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors to avoid blocking UI.
  }

  window.dispatchEvent(new CustomEvent("auth:session", { detail: null }));
};
