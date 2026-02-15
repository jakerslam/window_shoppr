"use client";

import { RefObject, useEffect } from "react";

/**
 * Side effects for the mobile bottom nav overlays (categories sheet + search bar).
 */
export default function useMobileBottomNavOverlays({
  isCategoriesOpen,
  isSearchOpen,
  normalizedPath,
  searchInputRef,
  setIsCategoriesOpen,
  setIsSearchOpen,
  setOpenCategory,
}: {
  isCategoriesOpen: boolean;
  isSearchOpen: boolean;
  normalizedPath: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
  setIsCategoriesOpen: (value: boolean) => void;
  setIsSearchOpen: (value: boolean) => void;
  setOpenCategory: (value: string | null) => void;
}) {
  /**
   * Lock body scrolling while the category sheet is open.
   */
  useEffect(() => {
    if (!isCategoriesOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // Prevent background scrolling.

    return () => {
      document.body.style.overflow = previousOverflow; // Restore previous scroll behavior.
    };
  }, [isCategoriesOpen]);

  /**
   * Focus the search input when the search overlay opens.
   */
  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    window.setTimeout(() => {
      searchInputRef.current?.focus(); // Focus the search field on open.
    }, 0);
  }, [isSearchOpen, searchInputRef]);

  /**
   * Mirror search open state on the body for CSS-driven hiding.
   */
  useEffect(() => {
    if (typeof document === "undefined") {
      return; // Skip DOM mutations on the server.
    }

    if (isSearchOpen) {
      document.body.dataset.mobileSearchOpen = "true"; // Flag search overlay state.
      return;
    }

    delete document.body.dataset.mobileSearchOpen; // Clear flag when closed.
  }, [isSearchOpen]);

  /**
   * Close mobile overlays whenever the route changes.
   */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsSearchOpen(false); // Hide mobile search when navigating.
      setIsCategoriesOpen(false); // Close category sheet when navigating.
      setOpenCategory(null); // Reset submenu expansion on route change.
    }, 0); // Defer state updates to avoid synchronous effect cascades.

    return () => {
      window.clearTimeout(timeoutId); // Clean up deferred close when route changes quickly.
    };
  }, [normalizedPath, setIsCategoriesOpen, setIsSearchOpen, setOpenCategory]);

  /**
   * Listen for feed-triggered category sheet requests.
   */
  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      if (customEvent.detail?.open) {
        setIsCategoriesOpen(true); // Open sheet from feed controls.
        setIsSearchOpen(false); // Ensure search is closed.
        setOpenCategory(null); // Reset subcategory state.
      }
    };

    window.addEventListener("mobile:categories", handleOpen);

    return () => {
      window.removeEventListener("mobile:categories", handleOpen);
    };
  }, [setIsCategoriesOpen, setIsSearchOpen, setOpenCategory]);
}

