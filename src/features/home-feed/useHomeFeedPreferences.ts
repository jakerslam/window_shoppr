"use client";

import { useEffect, useState } from "react";
import { getRecentlyViewedIds } from "@/shared/lib/recently-viewed";
import {
  DEFAULT_CONTENT_PREFERENCES,
  DEFAULT_SPEED_PREFERENCES,
  PROFILE_SETTINGS_STORAGE_KEY,
  FeedSpeedPreferences,
  readStoredProfileSettings,
} from "@/shared/lib/profile-settings";
import {
  WISHLIST_EVENT,
  WISHLIST_LISTS_STORAGE_KEY,
} from "@/features/wishlist/wishlist-constants";
import {
  TASTE_PROFILE_STORAGE_KEY,
  TasteProfile,
  createDefaultTasteProfile,
  readTasteProfile,
} from "@/shared/lib/taste-profile";

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
 * Home feed preference sources (profile settings, taste profile, wishlist lists).
 */
export default function useHomeFeedPreferences() {
  const [speedPreferences, setSpeedPreferences] = useState<FeedSpeedPreferences>(
    DEFAULT_SPEED_PREFERENCES,
  ); // Load speed multipliers from saved profile settings.
  const [preferredCategorySlugs, setPreferredCategorySlugs] = useState<string[]>(
    DEFAULT_CONTENT_PREFERENCES.preferredCategorySlugs,
  ); // Load preferred category slugs from saved content settings.
  const [recommendationListName, setRecommendationListName] = useState<
    string | null
  >(DEFAULT_CONTENT_PREFERENCES.recommendationListName); // Load selected wishlist list for recommendations.
  const [recommendationListIds, setRecommendationListIds] = useState<string[]>([]);
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Hydrate recently viewed ids after mount to avoid SSR mismatches.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined; // Skip storage sync during SSR.
    }

    const timeoutId = window.setTimeout(() => {
      setRecentlyViewedIds(getRecentlyViewedIds()); // Sync recently viewed IDs after mount.
    }, 0); // Defer to avoid hydration mismatches and render-phase lint warnings.

    return () => {
      window.clearTimeout(timeoutId); // Clean up deferred sync when unmounting.
    };
  }, []);

  /**
   * Load saved cozy/quick speed preferences from profile settings.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined; // Skip local storage access during SSR.
    }

    const syncProfileSettings = () => {
      const stored = readStoredProfileSettings(); // Read persisted profile settings.
      setSpeedPreferences(stored?.speedPreferences ?? DEFAULT_SPEED_PREFERENCES); // Fall back to defaults when missing.
      setPreferredCategorySlugs(
        stored?.contentPreferences.preferredCategorySlugs ??
          DEFAULT_CONTENT_PREFERENCES.preferredCategorySlugs,
      ); // Sync preferred category slugs for personalization.
      setRecommendationListName(
        stored?.contentPreferences.recommendationListName ??
          DEFAULT_CONTENT_PREFERENCES.recommendationListName,
      ); // Sync list-based recommendation selection.
    };

    const timeoutId = window.setTimeout(() => {
      syncProfileSettings(); // Hydrate profile settings after mount.
    }, 0);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== PROFILE_SETTINGS_STORAGE_KEY) {
        return; // Ignore unrelated local storage updates.
      }

      syncProfileSettings(); // Keep profile-derived preferences in sync across tabs.
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearTimeout(timeoutId); // Clean up deferred settings read.
      window.removeEventListener("storage", handleStorage); // Clean up storage listener.
    };
  }, []);

  /**
   * Sync the selected wishlist list ids for list-based recommendations.
   */
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
  }, [recommendationListName]);

  /**
   * Load local taste profile preferences for personalization scoring.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined; // Skip local storage access during SSR.
    }

    const timeoutId = window.setTimeout(() => {
      setTasteProfile(readTasteProfile() ?? createDefaultTasteProfile()); // Hydrate taste profile after mount.
    }, 0);

    const handleTasteProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ profile?: TasteProfile | null }>;
      if (customEvent.detail && "profile" in customEvent.detail) {
        setTasteProfile(customEvent.detail.profile ?? createDefaultTasteProfile()); // Apply event payload when present.
        return;
      }

      setTasteProfile(readTasteProfile() ?? createDefaultTasteProfile()); // Fall back to stored profile.
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== TASTE_PROFILE_STORAGE_KEY) {
        return; // Ignore unrelated local storage updates.
      }

      setTasteProfile(readTasteProfile() ?? createDefaultTasteProfile()); // Keep taste profile in sync across tabs.
    };

    window.addEventListener("taste-profile:updated", handleTasteProfileUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearTimeout(timeoutId); // Clean up deferred hydration read.
      window.removeEventListener(
        "taste-profile:updated",
        handleTasteProfileUpdated,
      ); // Clean up taste listener.
      window.removeEventListener("storage", handleStorage); // Clean up storage listener.
    };
  }, []);

  /**
   * Listen for global modal open/close events to pause the feed.
   */
  useEffect(() => {
    const handleModalToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      const isOpen = Boolean(customEvent.detail?.open);

      setIsModalOpen(isOpen); // Track modal open state.

      if (!isOpen && typeof window !== "undefined") {
        window.setTimeout(() => {
          setRecentlyViewedIds(getRecentlyViewedIds()); // Refresh recently viewed after closing modals.
        }, 0);
      }
    };

    window.addEventListener("modal:toggle", handleModalToggle); // Listen for modal open/close.

    return () => {
      window.removeEventListener("modal:toggle", handleModalToggle); // Clean up listener.
    };
  }, []);

  return {
    speedPreferences,
    preferredCategorySlugs,
    recommendationListIds,
    tasteProfile,
    recentlyViewedIds,
    isModalOpen,
  };
}

