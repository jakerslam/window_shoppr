"use client";

export const WISHLIST_SEARCH_STORAGE_KEY = "window_shoppr_wishlist_search"; // Persist wishlist search text across mobile overlay and page header.
export const WISHLIST_SEARCH_EVENT = "wishlist:search:update"; // Broadcast local search updates in the active tab.

/**
 * Read the wishlist search query from local storage.
 */
export const readWishlistSearchQuery = () => {
  if (typeof window === "undefined") {
    return ""; // Skip storage access during SSR.
  }

  const raw = window.localStorage.getItem(WISHLIST_SEARCH_STORAGE_KEY);
  return typeof raw === "string" ? raw : "";
};

/**
 * Persist wishlist search query and notify listeners.
 */
export const writeWishlistSearchQuery = (value: string) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  window.localStorage.setItem(WISHLIST_SEARCH_STORAGE_KEY, value);
  window.dispatchEvent(
    new CustomEvent(WISHLIST_SEARCH_EVENT, { detail: value }),
  ); // Sync same-tab components immediately.
};
