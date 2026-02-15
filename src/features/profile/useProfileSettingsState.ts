"use client";

import { useState } from "react";
import useProfileSettingsStorage from "@/features/profile/useProfileSettingsStorage";
import useTasteProfileState from "@/features/profile/useTasteProfileState";

/**
 * Combined profile settings state used by the Profile Settings UI.
 */
export default function useProfileSettingsState({ listNames }: { listNames: string[] }) {
  const [isTasteQuizOpen, setIsTasteQuizOpen] = useState(false);
  const storage = useProfileSettingsStorage({ listNames }); // Load + persist profile settings to local storage.
  const taste = useTasteProfileState(); // Load + persist taste profile to local storage.

  /**
   * Clear local-first personalization data for privacy controls.
   */
  const handleClearPersonalization = () => {
    taste.clearTasteProfileState(); // Clear taste profile + recently viewed.
    storage.resetContentPreferences(); // Reset stored content preferences.
  };

  /**
   * Apply onboarding quiz answers to content and taste preferences.
   */
  const handleTasteQuizApply = (nextCategorySlugs: string[], nextVibeTags: string[]) => {
    storage.setPreferredCategorySlugs(nextCategorySlugs); // Persist category taste selections.
    taste.handleTasteQuizSeed(nextCategorySlugs, nextVibeTags); // Seed taste weights.
  };

  return {
    ...storage,
    ...taste,
    isTasteQuizOpen,
    setIsTasteQuizOpen,
    handleClearPersonalization,
    handleTasteQuizApply,
  };
}

