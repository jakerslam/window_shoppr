"use client";

import { useEffect } from "react";
import {
  WISHLIST_EVENT,
  WISHLIST_LISTS_STORAGE_KEY,
} from "@/features/wishlist/wishlist-constants";

/**
 * Read wishlist list ids from local storage for list-based recommendations.
 */
const readWishlistListIdsFromStorage = (listName: string) => {
  if (typeof window === "undefined") {
    return [] as string[]; // Skip storage reads during SSR.
  }

  try {
    const raw = window.localStorage.getItem(WISHLIST_LISTS_STORAGE_KEY); // Read wishlist list payload.
    if (!raw) {
      return [] as string[]; // No list data saved yet.
    }

    const parsed = JSON.parse(raw) as {
      lists?: Record<string, unknown>;
    };
    const list = parsed.lists?.[listName]; // Grab the requested list ids.

    return Array.isArray(list) ? list.map(String) : ([] as string[]);
  } catch (error) {
    console.warn("Unable to read wishlist list ids", error); // Log parse/storage issues.
    return [] as string[]; // Fail closed on parse errors.
  }
};

/**
 * Sync the selected wishlist list ids for list-based recommendations.
 */
export default function useRecommendationListPreference({
  recommendationListName,
  setRecommendationListIds,
}: {
  recommendationListName: string | null;
  setRecommendationListIds: (ids: string[]) => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined; // Skip storage access during SSR.
    }

    if (!recommendationListName) {
      const timeoutId = window.setTimeout(() => {
        setRecommendationListIds([]); // Clear list ids when no recommendation list is selected.
      }, 0); // Defer to avoid render-phase lint warnings.

      return () => {
        window.clearTimeout(timeoutId); // Clean up deferred clear when changing selection.
      };
    }

    const syncListIds = () => {
      setRecommendationListIds(
        readWishlistListIdsFromStorage(recommendationListName),
      ); // Refresh ids from local storage snapshot.
    };

    const timeoutId = window.setTimeout(() => {
      syncListIds(); // Load list ids after mount and list selection changes.
    }, 0);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== WISHLIST_LISTS_STORAGE_KEY) {
        return; // Ignore unrelated local storage updates.
      }

      syncListIds(); // Refresh on cross-tab wishlist list updates.
    };

    const handleWishlistChange = () => {
      syncListIds(); // Refresh on same-tab wishlist changes.
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(WISHLIST_EVENT, handleWishlistChange);

    return () => {
      window.clearTimeout(timeoutId); // Clean up deferred hydration read.
      window.removeEventListener("storage", handleStorage); // Clean up storage listener.
      window.removeEventListener(WISHLIST_EVENT, handleWishlistChange); // Clean up wishlist listener.
    };
  }, [recommendationListName, setRecommendationListIds]);
}

