"use client";

import { useCallback, useEffect, useRef } from "react";

const CLICK_DELAY = 220; // Delay to distinguish single click from double click.
const LONG_PRESS_DELAY = 260; // Slightly above average click duration for discoverable hold actions.

/**
 * Gesture handlers for wishlist save interactions (click + double click).
 */
export default function useWishlistMenuGestures({
  productId,
  activeListName,
  openMenuOnMobileTap,
  openMenuOnDesktopHold,
  enableListMenu,
  isSaved,
  isSavedInList,
  saveToList,
  removeFromList,
  toggleSaved,
  notifyRemoval,
  setIsMenuOpen,
  setNewListName,
}: {
  productId: string;
  activeListName?: string;
  openMenuOnMobileTap?: boolean;
  openMenuOnDesktopHold?: boolean;
  enableListMenu?: boolean;
  isSaved: (id: string) => boolean;
  isSavedInList: (id: string, listName: string) => boolean;
  saveToList: (id: string, listName: string) => void;
  removeFromList: (id: string, listName: string) => void;
  toggleSaved: (id: string) => void;
  notifyRemoval: (removedProductId: string, listName: string) => void;
  setIsMenuOpen: (value: boolean) => void;
  setNewListName: (value: string) => void;
}) {
  const clickTimeoutRef = useRef<number | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  /**
   * Detect whether taps should open the list menu on mobile feed cards.
   */
  const shouldOpenOnMobileTap = useCallback(() => {
    if (!enableListMenu || !openMenuOnMobileTap) {
      return false; // Keep default click behavior when disabled.
    }

    if (typeof window === "undefined") {
      return false; // Skip mobile checks during SSR.
    }

    return window.matchMedia("(max-width: 820px)").matches; // Match mobile layout breakpoint.
  }, [enableListMenu, openMenuOnMobileTap]);

  /**
   * Detect whether desktop hold should open the list menu.
   */
  const shouldOpenOnDesktopHold = useCallback(() => {
    if (!enableListMenu || !openMenuOnDesktopHold) {
      return false; // Skip hold-to-open behavior when disabled.
    }

    if (typeof window === "undefined") {
      return false; // Skip viewport checks during SSR.
    }

    return window.matchMedia("(min-width: 821px)").matches; // Restrict hold-open menu to desktop widths.
  }, [enableListMenu, openMenuOnDesktopHold]);

  /**
   * Open the list menu and suppress single-click toggles.
   */
  const openMenu = useCallback(() => {
    if (!enableListMenu) {
      return; // Skip list menu behavior when disabled for this context.
    }

    suppressClickRef.current = true; // Prevent click toggles when menu opens.

    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current); // Cancel pending click toggle.
      clickTimeoutRef.current = null;
    }

    setIsMenuOpen(true); // Show the list menu.
  }, [enableListMenu, setIsMenuOpen]);

  /**
   * Close the list menu and clear input state.
   */
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false); // Hide the list menu.
    setNewListName(""); // Reset input value.
  }, [setIsMenuOpen, setNewListName]);

  /**
   * Handle single click toggles with a delay to detect double clicks.
   */
  const handleClick = useCallback(() => {
    if (shouldOpenOnMobileTap()) {
      openMenu(); // Open list picker directly on mobile tap.
      return;
    }

    if (suppressClickRef.current) {
      suppressClickRef.current = false; // Reset suppression for next click.
      return;
    }

    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current); // Clear previous click timer.
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      if (activeListName && activeListName !== "All") {
        const isInActiveList = isSavedInList(productId, activeListName); // Check active list membership.

        if (isInActiveList) {
          removeFromList(productId, activeListName); // Remove from the active list.
          notifyRemoval(productId, activeListName); // Notify removal for ghost state.
        } else {
          saveToList(productId, activeListName); // Save directly into the active list.
        }

        clickTimeoutRef.current = null;
        return;
      }

      if (activeListName === "All") {
        const wasSaved = isSaved(productId); // Capture saved state before toggle.
        toggleSaved(productId); // Toggle saved state across lists.

        if (wasSaved) {
          notifyRemoval(productId, activeListName); // Notify removal for ghost state.
        }

        clickTimeoutRef.current = null;
        return;
      }

      toggleSaved(productId); // Toggle saved state across lists.
      clickTimeoutRef.current = null;
    }, CLICK_DELAY);
  }, [
    activeListName,
    isSaved,
    isSavedInList,
    notifyRemoval,
    openMenu,
    productId,
    removeFromList,
    saveToList,
    shouldOpenOnMobileTap,
    toggleSaved,
  ]);

  /**
   * Handle double click to open the list menu.
   */
  const handleDoubleClick = useCallback(() => {
    if (!enableListMenu) {
      return; // Skip menu open behavior when disabled.
    }

    openMenu(); // Open list selection on double click.
  }, [enableListMenu, openMenu]);

  /**
   * Start hold detection for desktop feed save buttons.
   */
  const handlePointerDown = useCallback(() => {
    if (!shouldOpenOnDesktopHold()) {
      return; // Keep default click behavior outside desktop hold contexts.
    }

    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current); // Reset any existing hold timer.
    }

    longPressTimeoutRef.current = window.setTimeout(() => {
      openMenu(); // Open menu when hold threshold is reached.
      longPressTimeoutRef.current = null;
    }, LONG_PRESS_DELAY);
  }, [openMenu, shouldOpenOnDesktopHold]);

  /**
   * Cancel hold detection when pointer interaction ends.
   */
  const cancelPointerHold = useCallback(() => {
    if (!longPressTimeoutRef.current) {
      return; // Skip when no hold timer is active.
    }

    window.clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current); // Clean up click timer.
      }

      if (longPressTimeoutRef.current) {
        window.clearTimeout(longPressTimeoutRef.current); // Clean up long-press timer.
      }
    };
  }, []);

  return {
    openMenu,
    closeMenu,
    handleClick,
    handleDoubleClick,
    handlePointerDown,
    cancelPointerHold,
  };
}
