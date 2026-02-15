const AUTH_REDIRECT_STORAGE_KEY = "window_shoppr_auth_redirect"; // Persist intended post-auth route across login/signup screens.
const AUTH_ROUTE_SET = new Set(["/login", "/signup"]); // Ignore auth routes to prevent redirect loops.
const INTERNAL_BASE_URL = "https://window-shoppr.local"; // Internal parser origin for safe URL normalization.

/**
 * Normalize internal paths and block invalid or unsafe redirect targets.
 */
export const sanitizeAuthRedirectPath = (
  path: string | null | undefined,
): string | null => {
  if (!path) {
    return null; // No candidate redirect path.
  }

  const trimmedPath = path.trim();
  if (!trimmedPath.startsWith("/") || trimmedPath.startsWith("//")) {
    return null; // Only allow same-origin absolute paths.
  }

  try {
    const parsedUrl = new URL(trimmedPath, INTERNAL_BASE_URL);
    const normalizedPathname = parsedUrl.pathname.replace(/\/+$/, "") || "/";

    if (AUTH_ROUTE_SET.has(normalizedPathname)) {
      return null; // Skip auth routes so users always return to app content.
    }

    return `${normalizedPathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return null; // Ignore malformed URLs.
  }
};

/**
 * Attach a safe `next` param to an internal auth route.
 */
export const withAuthRedirectParam = (
  href: string,
  nextPath: string | null | undefined,
): string => {
  if (!href.startsWith("/")) {
    return href; // Do not modify external links.
  }

  const safeNextPath = sanitizeAuthRedirectPath(nextPath);
  if (!safeNextPath) {
    return href; // Keep href unchanged when no valid redirect exists.
  }

  const parsedUrl = new URL(href, INTERNAL_BASE_URL);
  parsedUrl.searchParams.set("next", safeNextPath);
  return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
};

/**
 * Save a post-auth redirect path in local storage.
 */
export const writeAuthRedirectPath = (path: string | null | undefined) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  const safePath = sanitizeAuthRedirectPath(path);
  if (!safePath) {
    return; // Ignore unsafe or invalid paths.
  }

  try {
    window.localStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, safePath);
  } catch {
    // Ignore storage errors to avoid blocking auth flow.
  }
};

/**
 * Read the stored post-auth redirect path.
 */
export const readAuthRedirectPath = (): string | null => {
  if (typeof window === "undefined") {
    return null; // Skip storage reads during SSR.
  }

  try {
    const rawValue = window.localStorage.getItem(AUTH_REDIRECT_STORAGE_KEY);
    return sanitizeAuthRedirectPath(rawValue);
  } catch {
    return null; // Ignore storage failures.
  }
};

/**
 * Remove any stored redirect path.
 */
export const clearAuthRedirectPath = () => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  try {
    window.localStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

/**
 * Resolve the next route after successful auth.
 */
export const resolvePostAuthRedirectPath = (
  nextParam: string | null | undefined,
  fallbackPath = "/",
): string => {
  const safeNextParam = sanitizeAuthRedirectPath(nextParam);
  if (safeNextParam) {
    clearAuthRedirectPath(); // Clear stale state once the explicit redirect is used.
    return safeNextParam;
  }

  const storedPath = readAuthRedirectPath();
  clearAuthRedirectPath(); // Consume redirect intent after auth.
  return storedPath ?? fallbackPath;
};
