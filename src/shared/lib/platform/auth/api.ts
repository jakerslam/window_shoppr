import { PUBLIC_ENV } from "@/shared/lib/platform/env";
import { AuthProvider, readAuthSession, writeAuthSession } from "@/shared/lib/platform/auth-session";
import { AuthActionResult } from "@/shared/lib/platform/auth/types";

type ApiSessionPayload = {
  provider?: AuthProvider;
  email?: string;
  displayName?: string;
  marketingEmails?: boolean;
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
  email,
  displayName,
  marketingEmails,
}: {
  provider: AuthProvider;
  email?: string;
  displayName?: string;
  marketingEmails?: boolean;
}) => {
  writeAuthSession({ provider, email, displayName, marketingEmails });
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
    email: sessionPayload.email,
    displayName: sessionPayload.displayName,
    marketingEmails: sessionPayload.marketingEmails,
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
  method?: "POST" | "PATCH";
  body?: Record<string, unknown>;
}): Promise<AuthActionResult | null> => {
  const apiBaseUrl = getAuthApiBaseUrl();
  if (!apiBaseUrl) {
    return null; // No backend auth configured.
  }

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const parsed = (await response.json()) as
      | {
          ok?: boolean;
          message?: string;
          session?: ApiSessionPayload;
        }
      | undefined;

    if (!response.ok || !parsed?.ok) {
      return { ok: false, message: parsed?.message || "Authentication failed." };
    }

    return persistApiSession(parsed.session);
  } catch {
    return null; // Fall back to local auth when API is unreachable.
  }
};
