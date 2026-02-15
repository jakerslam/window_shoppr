"use client";

import { useEffect } from "react";
import { getRecentlyViewedIds } from "@/shared/lib/recently-viewed";

/**
 * Hydrate recently viewed ids after mount to avoid SSR mismatches.
 */
export default function useRecentlyViewedPreference({
  setRecentlyViewedIds,
}: {
  setRecentlyViewedIds: (ids: string[]) => void;
}) {
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
  }, [setRecentlyViewedIds]);
}

