type AffiliateClickEvent = {
  productId: string;
  productSlug: string;
  retailer?: string;
  affiliateUrl: string;
  timestamp: string;
};

const AFFILIATE_CLICK_STORAGE_KEY = "window_shoppr_affiliate_clicks"; // Local storage key for click tracking.

/**
 * Parse stored affiliate click history safely.
 */
const readAffiliateClicks = () => {
  if (typeof window === "undefined") {
    return [] as AffiliateClickEvent[]; // Avoid storage access during SSR.
  }

  try {
    const raw = window.localStorage.getItem(AFFILIATE_CLICK_STORAGE_KEY) ?? "[]"; // Load stored events.
    const parsed = JSON.parse(raw) as AffiliateClickEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // Fall back to empty history on parse errors.
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

  const event: AffiliateClickEvent = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  try {
    const history = readAffiliateClicks();
    const nextHistory = [...history, event].slice(-200); // Keep a small rolling log.
    window.localStorage.setItem(
      AFFILIATE_CLICK_STORAGE_KEY,
      JSON.stringify(nextHistory),
    ); // Persist for future analytics.
  } catch {
    // Swallow storage errors to avoid blocking navigation.
  }

  window.dispatchEvent(
    new CustomEvent("affiliate:click", { detail: event }),
  ); // Broadcast for future backend wiring.
};
