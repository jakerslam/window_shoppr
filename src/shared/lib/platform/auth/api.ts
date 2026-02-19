import { PUBLIC_ENV } from "@/shared/lib/platform/env";
import { getCsrfHeaders } from "@/shared/lib/platform/csrf";
import { canSendMutationFromCurrentOrigin } from "@/shared/lib/platform/origin-policy";
import { AuthProvider, AuthRole, readAuthSession, writeAuthSession } from "@/shared/lib/platform/auth-session";
import { AuthActionResult } from "@/shared/lib/platform/auth/types";
import { assertAuthBackendReady, isLocalAuthFallbackAllowed } from "@/shared/lib/platform/auth/launch-guard";

type ApiSessionPayload = {
  provider?: AuthProvider;
  roles?: AuthRole[];
  email?: string;
  displayName?: string;
  marketingEmails?: boolean;
  expiresAt?: string;
};

type AuthApiEnvelope<T> = {
  ok?: boolean;
  message?: string;
  data?: T;
};

/**
 * Resolve an API base URL when backend auth is configured.
 */
const getAuthApiBaseUrl = () => PUBLIC_ENV.authApiUrl.replace(/\/+$/, "");

/**
 * Persist an auth session payload and return the normalized stored session.
 */
const persistSession = ({
  provider,
  roles,
  email,
  displayName,
  marketingEmails,
  expiresAt,
}: {
  provider: AuthProvider;
  roles?: AuthRole[];
  email?: string;
  displayName?: string;
  marketingEmails?: boolean;
  expiresAt?: string;
}) => {
  writeAuthSession({ provider, roles, email, displayName, marketingEmails, expiresAt });
  return readAuthSession();
};

/**
 * Convert API session payloads into a persisted auth result.
 */
const persistApiSession = (
  sessionPayload: ApiSessionPayload | undefined,
): AuthActionResult => {
  if (!sessionPayload?.provider) {
    return { ok: false, message: "Auth API returned an invalid session." };
  }

  const session = persistSession({
    provider: sessionPayload.provider,
    roles: sessionPayload.roles,
    email: sessionPayload.email,
    displayName: sessionPayload.displayName,
    marketingEmails: sessionPayload.marketingEmails,
    expiresAt: sessionPayload.expiresAt,
  });
  if (!session) {
    return { ok: false, message: "Unable to persist authenticated session." };
  }

  return { ok: true, session, source: "api" };
};

/**
 * Call the configured auth API endpoint and return parsed auth results.
 */
export const requestAuthApi = async ({
  path,
  method = "POST",
  body,
}: {
  path: string;
  method?: "GET" | "POST" | "PATCH";
  body?: Record<string, unknown>;
}): Promise<AuthActionResult | null> => {
  assertAuthBackendReady(`auth API request (${path})`);
  const apiBaseUrl = getAuthApiBaseUrl();
  if (!apiBaseUrl) {
    if (!isLocalAuthFallbackAllowed()) {
      return {
        ok: false,
        message: "Authentication backend is required in this deployment.",
      };
    }

    return null; // No backend auth configured.
  }

  try {
    const isMutationMethod = method !== "GET";
    if (isMutationMethod && !canSendMutationFromCurrentOrigin()) {
      return {
        ok: false,
        message: "Request blocked by origin policy.",
      };
    }

    const headers: Record<string, string> = {
      ...(isMutationMethod ? getCsrfHeaders() : {}), // Attach CSRF + origin assertions on mutations.
    };

    if (isMutationMethod || body) {
      headers["Content-Type"] = "application/json"; // Only set JSON content type when sending a JSON payload.
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      credentials: "include", // Include cookies for HttpOnly session auth.
      body: body ? JSON.stringify(body) : undefined,
    });
    const parsed = (await response.json().catch(() => undefined)) as
      | AuthApiEnvelope<{ session?: ApiSessionPayload }>
      | { ok?: boolean; message?: string; session?: ApiSessionPayload }
      | undefined;

    const envelope =
      parsed && typeof parsed === "object" && "ok" in parsed
        ? (parsed as AuthApiEnvelope<{ session?: ApiSessionPayload }>)
        : undefined;

    if (!response.ok || envelope?.ok === false) {
      return { ok: false, message: envelope?.message || "Authentication failed." };
    }

    const sessionPayload =
      envelope?.data?.session ?? (parsed as { session?: ApiSessionPayload } | undefined)?.session;

    return persistApiSession(sessionPayload);
  } catch {
    if (!isLocalAuthFallbackAllowed()) {
      return {
        ok: false,
        message: "Authentication backend is unavailable in this deployment.",
      };
    }

    return null; // Fall back to local auth when API is unreachable.
  }
};

/**
 * Request the active auth session from the backend (cookie-backed).
 */
export const requestAuthSessionFromApi = async (): Promise<AuthActionResult | null> => {
  const apiBaseUrl = getAuthApiBaseUrl();
  if (!apiBaseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/auth/session`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const parsed = (await response.json().catch(() => undefined)) as
      | AuthApiEnvelope<{ session?: ApiSessionPayload }>
      | undefined;

    if (!response.ok || parsed?.ok === false) {
      return { ok: false, message: parsed?.message || "Not authenticated." };
    }

    return persistApiSession(parsed?.data?.session);
  } catch {
    return null;
  }
};
