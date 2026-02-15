"use client";

import { useEffect } from "react";
import type { MutableRefObject } from "react";

/**
 * Wire external pause signals (modal visibility + wishlist menu dropdowns) into the motion engine.
 */
export default function useColumnPauseSignals({
  isModalOpen,
  isModalOpenRef,
  isWishlistMenuOpenRef,
  syncPauseState,
}: {
  isModalOpen: boolean;
  isModalOpenRef: MutableRefObject<boolean>;
  isWishlistMenuOpenRef: MutableRefObject<boolean>;
  syncPauseState: () => void;
}) {
  useEffect(() => {
    isModalOpenRef.current = isModalOpen; // Keep modal state in sync.
    syncPauseState(); // Recompute pause behavior against hover/menu state.
  }, [isModalOpen, isModalOpenRef, syncPauseState]);

  useEffect(() => {
    const handleWishlistMenuToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      isWishlistMenuOpenRef.current = Boolean(customEvent.detail?.open); // Track global wishlist menu state.
      syncPauseState(); // Pause/resume based on global menu visibility.
    };

    window.addEventListener("wishlist-menu:toggle", handleWishlistMenuToggle);
    return () => {
      window.removeEventListener("wishlist-menu:toggle", handleWishlistMenuToggle); // Clean up listener.
    };
  }, [isWishlistMenuOpenRef, syncPauseState]);
}
