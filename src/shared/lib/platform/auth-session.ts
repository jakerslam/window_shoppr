export type AuthSession = {
  isAuthenticated: true;
  provider: "email" | "google" | "x" | "meta";
  email?: string;
  updatedAt: string;
};

const AUTH_SESSION_STORAGE_KEY = "window_shoppr_auth_session"; // Local storage key for auth session stubs.

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

    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed || parsed.isAuthenticated !== true || !parsed.updatedAt) {
      return null; // Ignore malformed payloads.
    }

    const provider = parsed.provider;
    if (
      provider !== "email" &&
      provider !== "google" &&
      provider !== "x" &&
      provider !== "meta"
    ) {
      return null; // Ignore unknown providers.
    }

    return {
      isAuthenticated: true,
      provider,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      updatedAt: parsed.updatedAt,
    };
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
}: {
  provider: AuthSession["provider"];
  email?: string;
}) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  const payload: AuthSession = {
    isAuthenticated: true,
    provider,
    email: email?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors to avoid blocking UI.
  }

  window.dispatchEvent(new CustomEvent("auth:session", { detail: payload }));
};

