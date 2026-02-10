"use client";

import { useCallback, useEffect, useState } from "react";

const WISHLIST_STORAGE_KEY = "windowShopprWishlist"; // Storage key for saved product ids.
const WISHLIST_EVENT = "wishlist:change"; // Custom event for same-tab sync.

/**
 * Normalize wishlist ids into a unique, non-empty list.
 */
const normalizeWishlistIds = (ids: string[]) =>
  Array.from(new Set(ids.filter(Boolean))); // Remove empties and duplicates.

/**
 * Read wishlist ids from local storage when available.
 */
const readWishlistFromStorage = () => {
  if (typeof window === "undefined") {
    return []; // Skip storage access during SSR.
  }

  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY); // Load persisted wishlist.

    if (!raw) {
      return []; // Default to empty when missing.
    }

    const parsed = JSON.parse(raw); // Decode stored JSON.

    if (!Array.isArray(parsed)) {
      return []; // Guard against invalid shape.
    }

    return normalizeWishlistIds(parsed.map(String)); // Ensure a clean string list.
  } catch (error) {
    console.warn("Unable to read wishlist storage", error); // Log parse/storage issues.
    return []; // Fall back to empty when read fails.
  }
};

/**
 * Persist wishlist ids to local storage when available.
 */
const writeWishlistToStorage = (ids: string[]) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  try {
    window.localStorage.setItem(
      WISHLIST_STORAGE_KEY,
      JSON.stringify(normalizeWishlistIds(ids)),
    ); // Save normalized ids.
  } catch (error) {
    console.warn("Unable to write wishlist storage", error); // Log write issues.
  }
};

/**
 * Broadcast a wishlist update to same-tab listeners.
 */
const broadcastWishlistChange = () => {
  if (typeof window === "undefined") {
    return; // Skip event dispatch during SSR.
  }

  window.dispatchEvent(new CustomEvent(WISHLIST_EVENT)); // Notify local listeners.
};

/**
 * Shared wishlist state with local storage persistence.
 */
export const useWishlist = () => {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const syncFromStorage = useCallback(() => {
    const storedIds = readWishlistFromStorage(); // Pull latest ids from storage.
    setSavedIds(new Set(storedIds)); // Update local state with stored ids.
  }, []);

  useEffect(() => {
    syncFromStorage(); // Hydrate from storage on mount.

    if (typeof window === "undefined") {
      return undefined; // Skip event wiring during SSR.
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === WISHLIST_STORAGE_KEY) {
        syncFromStorage(); // Sync when other tabs update storage.
      }
    };

    const handleWishlistChange = () => {
      syncFromStorage(); // Sync when same-tab updates fire.
    };

    window.addEventListener("storage", handleStorage); // Listen for cross-tab changes.
    window.addEventListener(WISHLIST_EVENT, handleWishlistChange); // Listen for local changes.

    return () => {
      window.removeEventListener("storage", handleStorage); // Clean up storage listener.
      window.removeEventListener(WISHLIST_EVENT, handleWishlistChange); // Clean up local listener.
    };
  }, [syncFromStorage]);

  const isSaved = useCallback(
    (id: string) => savedIds.has(id),
    [savedIds],
  ); // Check if a product id is saved.

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev); // Clone the current saved ids.

      if (next.has(id)) {
        next.delete(id); // Remove if already saved.
      } else {
        next.add(id); // Add when not saved.
      }

      writeWishlistToStorage(Array.from(next)); // Persist the updated wishlist.
      broadcastWishlistChange(); // Notify other listeners in this tab.
      return next;
    });
  }, []);

  return { savedIds, isSaved, toggleSaved };
};
