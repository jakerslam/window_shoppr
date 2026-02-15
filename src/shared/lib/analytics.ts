type AffiliateClickEvent = {
  productId: string;
  productSlug: string;
  retailer?: string;
  affiliateUrl: string;
  timestamp: string;
};

type SearchEvent = {
  query: string;
  pathname: string;
  source: "topbar" | "mobile";
  timestamp: string;
};

type WishlistEvent = {
  action: "save" | "remove" | "create_list";
  productId?: string;
  listName?: string;
  timestamp: string;
};

const AFFILIATE_CLICK_STORAGE_KEY = "window_shoppr_affiliate_clicks"; // Local storage key for click tracking.
const SEARCH_STORAGE_KEY = "window_shoppr_search_events"; // Local storage key for search tracking.
const WISHLIST_STORAGE_KEY = "window_shoppr_wishlist_events"; // Local storage key for wishlist tracking.
const COOKIE_CONSENT_MODE_KEY = "window_shoppr_cookie_mode"; // Matches the cookie consent banner storage key.
const COOKIE_CONSENT_ALL_VALUE = "all"; // User opted into analytics + personalization cookies.
const MAX_EVENT_HISTORY = 200; // Keep small rolling logs for local analytics stubs.

/**
 * Determine whether the user has opted into analytics tracking.
 */
const hasAnalyticsConsent = () => {
  if (typeof window === "undefined") {
    return false; // Skip consent checks during SSR.
  }

  return (
    window.localStorage.getItem(COOKIE_CONSENT_MODE_KEY) ===
    COOKIE_CONSENT_ALL_VALUE
  ); // Require "Accept all" to store analytics events.
};

/**
 * Append an event to local storage, keeping a small rolling history.
 */
const appendStoredEvent = (storageKey: string, event: unknown) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  try {
    const raw = window.localStorage.getItem(storageKey) ?? "[]"; // Load existing history.
    const parsed = JSON.parse(raw) as unknown;
    const history = Array.isArray(parsed) ? parsed : [];
    const nextHistory = [...history, event].slice(-MAX_EVENT_HISTORY); // Trim history to a safe limit.
    window.localStorage.setItem(storageKey, JSON.stringify(nextHistory)); // Persist updated history.
  } catch {
    // Swallow storage errors to avoid breaking primary user actions.
  }
};

/**
 * Track an affiliate click locally and broadcast an event for future analytics.
 */
export const trackAffiliateClick = (payload: {
  productId: string;
  productSlug: string;
  retailer?: string;
  affiliateUrl: string;
}) => {
  if (typeof window === "undefined") {
    return; // Skip tracking during SSR.
  }

  if (!hasAnalyticsConsent()) {
    return; // Respect "essential only" cookie preferences.
  }

  const event: AffiliateClickEvent = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  appendStoredEvent(AFFILIATE_CLICK_STORAGE_KEY, event); // Persist for future analytics.

  window.dispatchEvent(
    new CustomEvent("affiliate:click", { detail: event }),
  ); // Broadcast for future backend wiring.
};

/**
 * Track a user-submitted search query.
 */
export const trackSearch = (payload: {
  query: string;
  pathname: string;
  source: SearchEvent["source"];
}) => {
  if (typeof window === "undefined") {
    return; // Skip tracking during SSR.
  }

  if (!hasAnalyticsConsent()) {
    return; // Respect "essential only" cookie preferences.
  }

  const normalizedQuery = payload.query.trim(); // Prevent noisy empty searches.

  if (!normalizedQuery) {
    return; // Skip empty queries.
  }

  const event: SearchEvent = {
    query: normalizedQuery,
    pathname: payload.pathname,
    source: payload.source,
    timestamp: new Date().toISOString(),
  };

  appendStoredEvent(SEARCH_STORAGE_KEY, event); // Persist local search history.
  window.dispatchEvent(new CustomEvent("search:submit", { detail: event })); // Broadcast for future backend wiring.
};

/**
 * Track wishlist actions (save/remove/create-list) for future analytics wiring.
 */
export const trackWishlistEvent = (payload: Omit<WishlistEvent, "timestamp">) => {
  if (typeof window === "undefined") {
    return; // Skip tracking during SSR.
  }

  if (!hasAnalyticsConsent()) {
    return; // Respect "essential only" cookie preferences.
  }

  const event: WishlistEvent = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  appendStoredEvent(WISHLIST_STORAGE_KEY, event); // Persist local wishlist history.
  window.dispatchEvent(
    new CustomEvent("wishlist:track", { detail: event }),
  ); // Broadcast for future backend wiring.
};
