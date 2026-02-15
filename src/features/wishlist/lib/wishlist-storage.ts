"use client";

import {
  DEFAULT_WISHLIST_NAME,
  WISHLIST_EVENT,
  WISHLIST_LEGACY_STORAGE_KEY,
  WISHLIST_LISTS_STORAGE_KEY,
} from "@/features/wishlist/wishlist-constants";

/**
 * Wishlist list data persisted in storage.
 */
export type WishlistListsState = {
  order: string[];
  lists: Record<string, string[]>;
};

/**
 * Normalize wishlist ids into a unique, non-empty list.
 */
export const normalizeWishlistIds = (ids: string[]) =>
  Array.from(new Set(ids.filter(Boolean))); // Remove empties and duplicates.

/**
 * Normalize list names for consistent storage.
 */
export const normalizeListName = (name: string) => name.trim(); // Trim whitespace.

/**
 * Normalize list order and enforce the default list at the top.
 */
export const normalizeListOrder = (order: string[]) => {
  const uniqueOrder = Array.from(new Set(order.filter(Boolean))); // Remove empties + dupes.
  const filtered = uniqueOrder.filter((name) => name !== DEFAULT_WISHLIST_NAME); // Drop default for reinsert.

  return [DEFAULT_WISHLIST_NAME, ...filtered]; // Ensure default is always first.
};

/**
 * Build a default wishlist state with a single list.
 */
export const buildDefaultWishlistState = (ids: string[] = []): WishlistListsState => ({
  order: [DEFAULT_WISHLIST_NAME],
  lists: {
    [DEFAULT_WISHLIST_NAME]: normalizeWishlistIds(ids),
  },
});

/**
 * Read wishlist lists from local storage when available.
 */
export const readWishlistListsFromStorage = () => {
  if (typeof window === "undefined") {
    return buildDefaultWishlistState(); // Skip storage access during SSR.
  }

  try {
    const raw = window.localStorage.getItem(WISHLIST_LISTS_STORAGE_KEY); // Load stored list data.

    if (!raw) {
      const legacyRaw = window.localStorage.getItem(WISHLIST_LEGACY_STORAGE_KEY); // Load legacy default list.

      if (!legacyRaw) {
        return buildDefaultWishlistState(); // Default when nothing stored.
      }

      const legacyParsed = JSON.parse(legacyRaw); // Parse legacy id list.
      const legacyIds = Array.isArray(legacyParsed)
        ? legacyParsed.map(String)
        : [];

      return buildDefaultWishlistState(legacyIds); // Seed default list from legacy data.
    }

    const parsed = JSON.parse(raw) as Partial<WishlistListsState>; // Decode stored JSON.
    const lists = parsed.lists ?? {}; // Default to empty lists.
    const order = normalizeListOrder(parsed.order ?? Object.keys(lists)); // Normalize list order.

    if (!lists[DEFAULT_WISHLIST_NAME]) {
      lists[DEFAULT_WISHLIST_NAME] = []; // Ensure default list exists.
    }

    const normalizedLists = Object.fromEntries(
      Object.entries(lists).map(([name, ids]) => [
        name,
        normalizeWishlistIds(Array.isArray(ids) ? ids.map(String) : []),
      ]),
    ); // Normalize all list ids.

    return {
      order,
      lists: normalizedLists,
    };
  } catch (error) {
    console.warn("Unable to read wishlist lists", error); // Log parse/storage issues.
    return buildDefaultWishlistState(); // Fall back to default on error.
  }
};

/**
 * Persist wishlist lists to local storage when available.
 */
export const writeWishlistListsToStorage = (state: WishlistListsState) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  try {
    const normalizedState = {
      order: normalizeListOrder(state.order),
      lists: Object.fromEntries(
        Object.entries(state.lists).map(([name, ids]) => [
          name,
          normalizeWishlistIds(ids),
        ]),
      ),
    };

    window.localStorage.setItem(
      WISHLIST_LISTS_STORAGE_KEY,
      JSON.stringify(normalizedState),
    ); // Persist list metadata.

    window.localStorage.setItem(
      WISHLIST_LEGACY_STORAGE_KEY,
      JSON.stringify(normalizedState.lists[DEFAULT_WISHLIST_NAME] ?? []),
    ); // Keep legacy key in sync.
  } catch (error) {
    console.warn("Unable to write wishlist lists", error); // Log write issues.
  }
};

/**
 * Broadcast a wishlist update to same-tab listeners.
 */
export const broadcastWishlistChange = () => {
  if (typeof window === "undefined") {
    return; // Skip event dispatch during SSR.
  }

  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(WISHLIST_EVENT)); // Notify local listeners.
  }, 0); // Defer to avoid render-phase state updates.
};

