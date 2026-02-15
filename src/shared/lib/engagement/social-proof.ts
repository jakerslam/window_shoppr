"use client";

import { useEffect, useState } from "react";
import { requestDataApi } from "@/shared/lib/platform/data-api";

const SAVE_COUNTS_STORAGE_KEY = "window_shoppr_product_save_counts"; // Local storage key for social-proof save counts.
const SAVE_COUNTS_EVENT = "social-proof:save-counts"; // Local event for same-tab save-count updates.
export const SOCIAL_PROOF_MIN_COUNT = 5; // Hide low counts to avoid weak social proof.

/**
 * Read local save-count map from storage.
 */
const readSaveCountMap = () => {
  if (typeof window === "undefined") {
    return {} as Record<string, number>; // Skip storage reads during SSR.
  }

  try {
    const raw = window.localStorage.getItem(SAVE_COUNTS_STORAGE_KEY);
    if (!raw) {
      return {}; // Default to empty map when no counts are stored.
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {}; // Ignore malformed map payloads.
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [
        key,
        typeof value === "number" && Number.isFinite(value) && value >= 0
          ? Math.round(value)
          : 0,
      ]),
    ); // Normalize all stored values to non-negative integers.
  } catch {
    return {}; // Ignore parse failures and use empty map.
  }
};

/**
 * Persist save-count map to local storage.
 */
const writeSaveCountMap = (map: Record<string, number>) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  try {
    window.localStorage.setItem(SAVE_COUNTS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage failures to avoid blocking wishlist interactions.
  }
};

/**
 * Broadcast local save-count updates to subscribed components.
 */
const broadcastSaveCountUpdate = () => {
  if (typeof window === "undefined") {
    return; // Skip event dispatch during SSR.
  }

  window.dispatchEvent(new CustomEvent(SAVE_COUNTS_EVENT));
};

/**
 * Read one product save-count, falling back to provided baseline.
 */
export const readProductSaveCount = (productId: string, fallback = 0) => {
  const map = readSaveCountMap();
  const stored = map[productId];
  return typeof stored === "number" ? stored : Math.max(0, Math.round(fallback));
};

/**
 * Format save counts for compact card and detail UI.
 */
export const formatSaveCountLabel = (saveCount: number) => {
  if (saveCount >= 1_000_000) {
    return `${(saveCount / 1_000_000).toFixed(1)}M saves`;
  }

  if (saveCount >= 1_000) {
    return `${(saveCount / 1_000).toFixed(1)}k saves`;
  }

  return `${saveCount} ${saveCount === 1 ? "save" : "saves"}`;
};

/**
 * Format counts as compact numbers without suffix text.
 */
export const formatCompactCount = (count: number) => {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}k`;
  }

  return `${count}`;
};

/**
 * Apply a save-state transition to social-proof counts and queue SQL persistence.
 */
export const applyProductSaveTransition = ({
  productId,
  wasSaved,
  isSaved,
  baseline = 0,
}: {
  productId: string;
  wasSaved: boolean;
  isSaved: boolean;
  baseline?: number;
}) => {
  if (wasSaved === isSaved) {
    return; // Skip when product global save-state did not change.
  }

  const delta = isSaved ? 1 : -1;
  const map = readSaveCountMap();
  const currentCount =
    typeof map[productId] === "number"
      ? map[productId]
      : Math.max(0, Math.round(baseline));
  const nextCount = Math.max(0, currentCount + delta);
  const nextMap = {
    ...map,
    [productId]: nextCount,
  };

  writeSaveCountMap(nextMap);
  broadcastSaveCountUpdate();

  void requestDataApi({
    path: "/data/social-proof/saves",
    method: "POST",
    body: {
      productId,
      delta,
      observedAt: new Date().toISOString(),
    },
  }); // Forward aggregate save delta to SQL backend when available.
};

/**
 * Subscribe to a product save-count with storage + in-tab sync updates.
 */
export const useProductSaveCount = (productId: string, baseline = 0) => {
  const [saveCount, setSaveCount] = useState(() =>
    readProductSaveCount(productId, baseline),
  );

  useEffect(() => {
    const handleUpdate = () => {
      setSaveCount(readProductSaveCount(productId, baseline)); // Sync with latest local save-count map.
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SAVE_COUNTS_STORAGE_KEY) {
        handleUpdate(); // Sync counts when another tab updates storage.
      }
    };

    window.addEventListener(SAVE_COUNTS_EVENT, handleUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(SAVE_COUNTS_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [baseline, productId]);

  return saveCount;
};
