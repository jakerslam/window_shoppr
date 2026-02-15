export type AuthProvider = "email" | "google" | "x" | "meta";

export type AuthSession = {
  isAuthenticated: true;
  provider: AuthProvider;
  email?: string;
  displayName?: string;
  marketingEmails?: boolean;
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
    email: typeof parsed.email === "string" ? parsed.email : undefined,
    displayName:
      typeof parsed.displayName === "string" ? parsed.displayName : undefined,
    marketingEmails:
      typeof parsed.marketingEmails === "boolean"
        ? parsed.marketingEmails
        : undefined,
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
    return normalizeAuthSession(parsed);
  } catch {
    return null; // Ignore parse failures.
  }
};

/**
 * Persist a stubbed auth session and broadcast updates to the current tab.
 */
export const writeAuthSession = ({
  provider,
  email,
  displayName,
  marketingEmails,
  updatedAt,
}: {
  provider: AuthProvider;
  email?: string;
  displayName?: string;
  marketingEmails?: boolean;
  updatedAt?: string;
}) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  const payload: AuthSession = {
    isAuthenticated: true,
    provider,
    email: email?.trim() || undefined,
    displayName: displayName?.trim() || undefined,
    marketingEmails,
    updatedAt: updatedAt ?? new Date().toISOString(),
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
