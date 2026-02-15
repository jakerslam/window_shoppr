"use client";

import { useEffect } from "react";
import {
  TASTE_PROFILE_STORAGE_KEY,
  TasteProfile,
  createDefaultTasteProfile,
  readTasteProfile,
} from "@/shared/lib/taste-profile";

/**
 * Load local taste profile preferences for personalization scoring.
 */
export default function useTasteProfilePreference({
  setTasteProfile,
}: {
  setTasteProfile: (profile: TasteProfile | null) => void;
}) {
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
  }, [setTasteProfile]);
}

