import { requestDataApi } from "@/shared/lib/platform/data-api";
import { PUBLIC_ENV } from "@/shared/lib/platform/env";

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
  action: "save" | "remove" | "create_list" | "delete_list";
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
 * Return true when backend analytics ingestion is available.
 */
const isAnalyticsIngestEnabled = () =>
  PUBLIC_ENV.deployTarget === "runtime" && Boolean(PUBLIC_ENV.dataApiUrl.trim());

/**
 * Create a unique analytics event id for backend ingestion.
 */
const createAnalyticsEventId = () => {
  if (typeof window === "undefined") {
    return ""; // Avoid generating ids during SSR.
  }

  if (typeof window.crypto?.randomUUID === "function") {
    return `ae_${window.crypto.randomUUID()}`; // Prefer cryptographically strong ids.
  }

  return `ae_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`; // Fallback id for older browsers.
};

/**
 * Send a best-effort analytics event to the Data API (local reference server or production backend later).
 */
const ingestAnalyticsEvent = (event: {
  id?: string;
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}) => {
  if (typeof window === "undefined") {
    return; // Skip ingestion during SSR.
  }

  if (!isAnalyticsIngestEnabled()) {
    return; // Skip when runtime backend is not configured.
  }

  void requestDataApi({
    path: "/data/analytics/events",
    method: "POST",
    body: {
      events: [
        {
          id: event.id,
          type: event.type,
          occurredAt: event.occurredAt,
          payload: event.payload,
        },
      ],
    },
  }); // Fire-and-forget ingestion to avoid blocking primary UI flows.
};

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
  ingestAnalyticsEvent({
    id: createAnalyticsEventId(),
    type: "affiliate_click",
    occurredAt: event.timestamp,
    payload: payload,
  }); // Mirror consented affiliate clicks into backend analytics ingestion.

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
  ingestAnalyticsEvent({
    id: createAnalyticsEventId(),
    type: "search",
    occurredAt: event.timestamp,
    payload: {
      query: event.query,
      pathname: event.pathname,
      source: event.source,
    },
  }); // Mirror consented searches into backend analytics ingestion.
  window.dispatchEvent(new CustomEvent("search:submit", { detail: event })); // Broadcast for future backend wiring.
};

/**
 * Track wishlist actions (save/remove/create/delete-list) for future analytics wiring.
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
  ingestAnalyticsEvent({
    id: createAnalyticsEventId(),
    type: "wishlist",
    occurredAt: event.timestamp,
    payload: payload,
  }); // Mirror consented wishlist actions into backend analytics ingestion.
  window.dispatchEvent(
    new CustomEvent("wishlist:track", { detail: event }),
  ); // Broadcast for future backend wiring.
};
