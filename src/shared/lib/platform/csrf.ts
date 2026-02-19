"use client";

const CSRF_STORAGE_KEY = "window_shoppr_csrf_token";
const CSRF_ISSUED_AT_KEY = "window_shoppr_csrf_issued_at";
const CSRF_TTL_MS = 1000 * 60 * 60 * 12; // Rotate token every 12 hours.

/**
 * Build a lightweight CSRF token for same-origin mutation calls.
 */
const generateCsrfToken = () =>
  `csrf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;

/**
 * Read or rotate a persisted CSRF token for browser mutation requests.
 */
export const getCsrfToken = () => {
  if (typeof window === "undefined") {
    return ""; // Skip token generation in SSR contexts.
  }

  const now = Date.now();
  const storedToken = window.localStorage.getItem(CSRF_STORAGE_KEY);
  const issuedAtRaw = window.localStorage.getItem(CSRF_ISSUED_AT_KEY);
  const issuedAt = issuedAtRaw ? Number(issuedAtRaw) : 0;

  if (storedToken && Number.isFinite(issuedAt) && now - issuedAt < CSRF_TTL_MS) {
    return storedToken;
  }

  const nextToken = generateCsrfToken();
  window.localStorage.setItem(CSRF_STORAGE_KEY, nextToken);
  window.localStorage.setItem(CSRF_ISSUED_AT_KEY, String(now));
  return nextToken;
};

/**
 * Build CSRF-related headers for state-changing API calls.
 */
export const getCsrfHeaders = () => {
  if (typeof window === "undefined") {
    return {} as Record<string, string>;
  }

  return {
    "x-csrf-token": getCsrfToken(),
    "x-window-origin": window.location.origin, // Backend should enforce allowlisted origins.
  };
};
