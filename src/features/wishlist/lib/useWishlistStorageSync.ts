"use client";

import { useEffect } from "react";
import {
  WISHLIST_EVENT,
  WISHLIST_LEGACY_STORAGE_KEY,
  WISHLIST_LISTS_STORAGE_KEY,
} from "@/features/wishlist/wishlist-constants";

/**
 * Keep wishlist state in sync with local storage (same tab + other tabs).
 */
export default function useWishlistStorageSync({
  syncFromStorage,
}: {
  syncFromStorage: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        syncFromStorage(); // Hydrate from storage on mount.
      }, 0); // Defer to avoid render-phase lint warnings.
    }

    if (typeof window === "undefined") {
      return undefined; // Skip event wiring during SSR.
    }

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === WISHLIST_LISTS_STORAGE_KEY ||
        event.key === WISHLIST_LEGACY_STORAGE_KEY
      ) {
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
}

