/**
 * Storage keys for recently viewed personalization state.
 */
const RECENTLY_VIEWED_KEY = "windowShopprRecentlyViewed"; // Local storage key.

/**
 * Default max items to keep in the recently viewed list.
 */
const DEFAULT_LIMIT = 12; // Keep the list small for cookie size.

/**
 * Parse a serialized ID list safely.
 */
const parseIds = (value: string | null) => {
  if (!value) {
    return []; // Return empty list when storage is missing.
  }

  try {
    const parsed = JSON.parse(value) as unknown; // Attempt to parse stored JSON.

    if (Array.isArray(parsed)) {
      return parsed.filter((entry) => typeof entry === "string"); // Keep only string IDs.
    }
  } catch (error) {
    void error; // Ignore malformed storage payloads.
  }

  return []; // Fall back to an empty list when invalid.
};

/**
 * Read a cookie value by name.
 */
const readCookieValue = (name: string) => {
  const cookieString = typeof document === "undefined" ? "" : document.cookie; // Read cookies safely.
  const prefix = `${name}=`; // Build the cookie prefix to match.

  return (
    cookieString
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(prefix))
      ?.slice(prefix.length) ?? null
  ); // Extract the cookie value when present.
};

/**
 * Return the currently stored recently viewed product IDs.
 */
export const getRecentlyViewedIds = () => {
  if (typeof window === "undefined") {
    return []; // Skip storage access during SSR.
  }

  const stored = window.localStorage.getItem(RECENTLY_VIEWED_KEY); // Read from local storage.
  const parsed = parseIds(stored); // Parse stored IDs safely.

  if (parsed.length > 0) {
    return parsed; // Prefer local storage when available.
  }

  const cookieValue = readCookieValue(RECENTLY_VIEWED_KEY); // Fall back to cookie state.
  const decoded = cookieValue ? decodeURIComponent(cookieValue) : null; // Decode cookie payload.

  return parseIds(decoded); // Parse cookie payload into IDs.
};

/**
 * Persist a recently viewed product ID and return the updated list.
 */
export const trackRecentlyViewed = (
  productId: string,
  limit = DEFAULT_LIMIT,
) => {
  if (typeof window === "undefined") {
    return []; // Skip storage access during SSR.
  }

  const existing = getRecentlyViewedIds(); // Load the current ID list.
  const withoutId = existing.filter((entry) => entry !== productId); // Remove duplicates first.
  const next = [productId, ...withoutId].slice(0, limit); // Insert newest and trim list.
  const serialized = JSON.stringify(next); // Serialize list for storage.

  window.localStorage.setItem(RECENTLY_VIEWED_KEY, serialized); // Persist to local storage.
  document.cookie = `${RECENTLY_VIEWED_KEY}=${encodeURIComponent(serialized)};path=/;max-age=2592000`; // Mirror in cookie.

  return next; // Return the updated list for callers.
};

/**
 * Clear recently viewed state from local storage and cookies.
 */
export const clearRecentlyViewed = () => {
  if (typeof window === "undefined") {
    return; // Skip storage access during SSR.
  }

  window.localStorage.removeItem(RECENTLY_VIEWED_KEY); // Remove local storage record.
  document.cookie = `${RECENTLY_VIEWED_KEY}=;path=/;max-age=0`; // Expire cookie immediately.
};
