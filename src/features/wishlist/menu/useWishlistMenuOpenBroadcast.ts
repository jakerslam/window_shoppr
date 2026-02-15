"use client";

import { useEffect } from "react";

let openWishlistMenuCount = 0; // Track open menus globally to coordinate feed pause/resume.

/**
 * Broadcast current wishlist menu open state.
 */
const emitWishlistMenuState = () => {
  if (typeof window === "undefined") {
    return; // Skip events during SSR.
  }

  window.dispatchEvent(
    new CustomEvent("wishlist-menu:toggle", {
      detail: { open: openWishlistMenuCount > 0 },
    }),
  ); // Notify listeners when any wishlist menu opens/closes.
};

/**
 * Broadcast menu open state so feed columns can pause while list pickers are visible.
 */
export default function useWishlistMenuOpenBroadcast(isMenuOpen: boolean) {
  useEffect(() => {
    if (!isMenuOpen) {
      return undefined; // Skip wiring while closed.
    }

    openWishlistMenuCount += 1; // Track a newly opened menu.
    emitWishlistMenuState(); // Broadcast updated open state.

    return () => {
      openWishlistMenuCount = Math.max(0, openWishlistMenuCount - 1); // Prevent negative counters.
      emitWishlistMenuState(); // Broadcast updated close state.
    };
  }, [isMenuOpen]);
}

