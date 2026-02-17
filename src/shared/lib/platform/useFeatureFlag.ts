"use client";

import { useEffect, useState } from "react";
import {
  FEATURE_FLAGS_EVENT,
  FEATURE_FLAGS_STORAGE_KEY,
  FeatureFlagKey,
  getBaseFeatureFlags,
  getResolvedFeatureFlags,
} from "@/shared/lib/platform/feature-flags";

/**
 * Read one feature flag and keep it synced with local overrides.
 */
export const useFeatureFlag = (flagKey: FeatureFlagKey) => {
  const [isEnabled, setIsEnabled] = useState(() => {
    const baseFlags = getBaseFeatureFlags();
    return baseFlags[flagKey]; // Keep SSR + first client render stable using defaults/env.
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined; // Skip listeners during SSR.
    }

    const syncFlags = () => {
      const resolvedFlags = getResolvedFeatureFlags();
      setIsEnabled(resolvedFlags[flagKey]); // Apply env + local override resolution.
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== FEATURE_FLAGS_STORAGE_KEY) {
        return; // Ignore unrelated local-storage updates.
      }

      syncFlags(); // Keep cross-tab overrides in sync.
    };

    syncFlags(); // Hydrate local overrides after mount.
    window.addEventListener("storage", handleStorage);
    window.addEventListener(FEATURE_FLAGS_EVENT, syncFlags);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(FEATURE_FLAGS_EVENT, syncFlags);
    };
  }, [flagKey]);

  return isEnabled;
};

