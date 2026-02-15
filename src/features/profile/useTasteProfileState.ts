"use client";

import { useEffect, useRef, useState } from "react";
import { clearRecentlyViewed } from "@/shared/lib/engagement/recently-viewed";
import {
  TasteProfile,
  applyTasteQuizSelections,
  clearTasteProfile,
  createDefaultTasteProfile,
  readTasteProfile,
  setTastePersonalizationEnabled,
  writeTasteProfile,
} from "@/shared/lib/profile/taste-profile";

/**
 * Taste profile state + persistence wrapper used by profile settings.
 */
export default function useTasteProfileState() {
  const hasTasteMountedRef = useRef(false);
  const skipNextTasteWriteRef = useRef(false);
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>(
    () => readTasteProfile() ?? createDefaultTasteProfile(),
  ); // Initialize taste profile state from local storage once.

  /**
   * Persist taste profile updates after first render.
   */
  useEffect(() => {
    if (!hasTasteMountedRef.current) {
      hasTasteMountedRef.current = true; // Skip first write to avoid clobbering stored state.
      return;
    }

    if (skipNextTasteWriteRef.current) {
      skipNextTasteWriteRef.current = false; // Consume one-shot write skip used for clearing.
      return;
    }

    writeTasteProfile(tasteProfile); // Persist taste profile changes.
  }, [tasteProfile]);

  /**
   * Toggle personalization application for the home feed.
   */
  const handlePersonalizationToggle = (enabled: boolean) => {
    setTasteProfile((prev) => setTastePersonalizationEnabled(prev, enabled)); // Persist personalization enablement.
  };

  /**
   * Apply onboarding quiz answers to the taste profile weights.
   */
  const handleTasteQuizSeed = (nextCategorySlugs: string[], nextVibeTags: string[]) => {
    setTasteProfile((prev) =>
      applyTasteQuizSelections(prev, nextCategorySlugs, nextVibeTags),
    ); // Seed taste weights from quiz selections.
  };

  /**
   * Clear local-first taste data for privacy controls.
   */
  const clearTasteProfileState = () => {
    skipNextTasteWriteRef.current = true; // Avoid immediately recreating cleared storage payloads.
    clearTasteProfile(); // Remove taste profile from local storage.
    clearRecentlyViewed(); // Clear recently viewed personalization state.
    setTasteProfile(createDefaultTasteProfile()); // Reset taste profile in memory.
  };

  return {
    tasteProfile,
    handlePersonalizationToggle,
    handleTasteQuizSeed,
    clearTasteProfileState,
  };
}

