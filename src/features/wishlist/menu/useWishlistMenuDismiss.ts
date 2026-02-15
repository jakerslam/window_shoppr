"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Close the wishlist menu when clicking outside or pressing escape.
 */
export default function useWishlistMenuDismiss({
  isMenuOpen,
  wrapperRef,
  closeMenu,
}: {
  isMenuOpen: boolean;
  wrapperRef: RefObject<HTMLDivElement | null>;
  closeMenu: () => void;
}) {
  useEffect(() => {
    if (!isMenuOpen) {
      return undefined; // Skip when menu is closed.
    }

    const handlePointerDownOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        closeMenu(); // Close when clicking outside of the menu.
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu(); // Close when escape is pressed.
      }
    };

    window.addEventListener("mousedown", handlePointerDownOutside); // Detect outside clicks.
    window.addEventListener("pointerdown", handlePointerDownOutside); // Detect touch/pointer outside clicks.
    window.addEventListener("keydown", handleKeyDown); // Listen for escape.

    return () => {
      window.removeEventListener("mousedown", handlePointerDownOutside); // Clean up listener.
      window.removeEventListener("pointerdown", handlePointerDownOutside); // Clean up listener.
      window.removeEventListener("keydown", handleKeyDown); // Clean up listener.
    };
  }, [closeMenu, isMenuOpen, wrapperRef]);
}

