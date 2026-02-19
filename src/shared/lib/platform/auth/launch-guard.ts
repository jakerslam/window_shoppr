import { PUBLIC_ENV } from "@/shared/lib/platform/env";

/**
 * Determine whether local auth fallback is allowed for the current deploy target.
 */
export const isLocalAuthFallbackAllowed = () => {
  if (PUBLIC_ENV.deployTarget === "static-export") {
    return true; // Static export needs local auth fallback during beta hosting.
  }

  return PUBLIC_ENV.allowLocalAuthFallback;
};

/**
 * Enforce backend auth endpoint presence when local fallback is disabled.
 */
export const assertAuthBackendReady = (action: string) => {
  if (isLocalAuthFallbackAllowed()) {
    return;
  }

  if (!PUBLIC_ENV.authApiUrl.trim()) {
    throw new Error(
      `Auth backend required for ${action}: NEXT_PUBLIC_AUTH_API_URL must be configured and local auth fallback must remain disabled.`,
    );
  }
};
