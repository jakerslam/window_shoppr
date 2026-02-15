"use client";

import { useCallback, useState } from "react";
import { getRecentlyViewedIds } from "@/shared/lib/engagement/recently-viewed";
import {
  DEFAULT_CONTENT_PREFERENCES,
  DEFAULT_SPEED_PREFERENCES,
  FeedSpeedPreferences,
} from "@/shared/lib/profile/profile-settings";
import {
  TasteProfile,
} from "@/shared/lib/profile/taste-profile";
import useModalOpenPreference from "@/features/home-feed/preferences/useModalOpenPreference";
import useProfileSettingsPreferences from "@/features/home-feed/preferences/useProfileSettingsPreferences";
import useRecommendationListPreference from "@/features/home-feed/preferences/useRecommendationListPreference";
import useRecentlyViewedPreference from "@/features/home-feed/preferences/useRecentlyViewedPreference";
import useTasteProfilePreference from "@/features/home-feed/preferences/useTasteProfilePreference";

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

  const refreshRecentlyViewed = useCallback(() => {
    setRecentlyViewedIds(getRecentlyViewedIds()); // Sync recently viewed ids from storage.
  }, []);

  useRecentlyViewedPreference({ setRecentlyViewedIds }); // Hydrate recently viewed after mount.

  useProfileSettingsPreferences({
    setSpeedPreferences,
    setPreferredCategorySlugs,
    setRecommendationListName,
  }); // Keep profile settings in sync.

  useRecommendationListPreference({
    recommendationListName,
    setRecommendationListIds,
  }); // Keep list-based recommendation ids in sync.

  useTasteProfilePreference({ setTasteProfile }); // Keep taste profile signals in sync.

  useModalOpenPreference({
    setIsModalOpen,
    refreshRecentlyViewed,
  }); // Pause feed behind modals + refresh recently viewed after close.

  return {
    speedPreferences,
    preferredCategorySlugs,
    recommendationListIds,
    tasteProfile,
    recentlyViewedIds,
    isModalOpen,
  };
}
