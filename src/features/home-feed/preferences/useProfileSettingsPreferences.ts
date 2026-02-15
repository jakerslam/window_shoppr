"use client";

import { useEffect } from "react";
import {
  DEFAULT_CONTENT_PREFERENCES,
  DEFAULT_SPEED_PREFERENCES,
  FeedSpeedPreferences,
  PROFILE_SETTINGS_STORAGE_KEY,
  readStoredProfileSettings,
} from "@/shared/lib/profile/profile-settings";

/**
 * Load and keep profile settings in sync (speed preferences + content preferences).
 */
export default function useProfileSettingsPreferences({
  setSpeedPreferences,
  setPreferredCategorySlugs,
  setRecommendationListName,
}: {
  setSpeedPreferences: (value: FeedSpeedPreferences) => void;
  setPreferredCategorySlugs: (value: string[]) => void;
  setRecommendationListName: (value: string | null) => void;
}) {
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
  }, [
    setPreferredCategorySlugs,
    setRecommendationListName,
    setSpeedPreferences,
  ]);
}

