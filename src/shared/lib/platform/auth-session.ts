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

    if (Number.isFinite(new Date(session.expiresAt).getTime()) && new Date(session.expiresAt) < new Date()) {
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
