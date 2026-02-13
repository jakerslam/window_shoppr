"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_WISHLIST_NAME } from "@/features/wishlist/wishlist-constants";
import { useWishlist } from "@/features/wishlist/wishlist";

const LONG_PRESS_DELAY = 260; // Slightly above an average click duration for easier discovery.
const CLICK_DELAY = 220; // Delay to distinguish single click from double click.

/**
 * Wishlist menu state and handlers for the save button UI.
 */
export default function useWishlistMenu({
  productId,
  activeListName,
  onListRemoval,
  openMenuOnMobileTap,
}: {
  productId: string;
  activeListName?: string;
  onListRemoval?: (productId: string, listName: string) => void;
  openMenuOnMobileTap?: boolean;
}) {
  const {
    isSaved,
    isSavedInList,
    listNames,
    addList,
    saveToList,
    removeFromList,
    toggleSaved,
  } = useWishlist();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const clickTimeoutRef = useRef<number | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const isItemSaved = isSaved(productId); // Any-list membership for star state.
  const menuId = `wishlist-menu-${productId}`; // Unique id for the dropdown menu.

  /**
   * Detect whether taps should open the list menu on mobile feed cards.
   */
  const shouldOpenOnMobileTap = useCallback(() => {
    if (!openMenuOnMobileTap) {
      return false; // Keep default click behavior when disabled.
    }

    if (typeof window === "undefined") {
      return false; // Skip mobile checks during SSR.
    }

    return window.matchMedia("(max-width: 820px)").matches; // Match mobile layout breakpoint.
  }, [openMenuOnMobileTap]);

  /**
   * Defer removal callbacks to avoid render-phase updates.
   */
  const notifyRemoval = useCallback(
    (removedProductId: string, listName: string) => {
      if (!onListRemoval) {
        return; // Skip when no removal handler is supplied.
      }

      window.setTimeout(() => {
        onListRemoval(removedProductId, listName); // Defer to avoid setState-in-render warnings.
      }, 0);
    },
    [onListRemoval],
  );

  /**
   * Open the list menu and suppress single-click toggles.
   */
  const openMenu = useCallback(() => {
    suppressClickRef.current = true; // Prevent click toggles when menu opens.

    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current); // Cancel pending click toggle.
      clickTimeoutRef.current = null;
    }

    setIsMenuOpen(true); // Show the list menu.
  }, []);

  /**
   * Close the list menu and clear input state.
   */
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false); // Hide the list menu.
    setNewListName(""); // Reset input value.
  }, []);

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
    productId,
    removeFromList,
    saveToList,
    toggleSaved,
    shouldOpenOnMobileTap,
    openMenu,
  ]);

  /**
   * Handle double click to open the list menu.
   */
  const handleDoubleClick = useCallback(() => {
    openMenu(); // Open list selection on double click.
  }, [openMenu]);

  /**
   * Handle long-press to open the list menu.
   */
  const handlePointerDown = useCallback(() => {
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current); // Clear previous long-press timer.
    }

    longPressTimeoutRef.current = window.setTimeout(() => {
      openMenu(); // Open list selection after long press.
    }, LONG_PRESS_DELAY);
  }, [openMenu]);

  /**
   * Clear the long-press timer when releasing the pointer.
   */
  const handlePointerUp = useCallback(() => {
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current); // Cancel pending long-press.
      longPressTimeoutRef.current = null;
    }
  }, []);

  /**
   * Handle selecting a list name from the menu.
   */
  const handleSelectList = useCallback(
    (listName: string) => {
      const isActive = isSavedInList(productId, listName); // Check list membership.

      if (isActive) {
        removeFromList(productId, listName); // Remove from the selected list.
        notifyRemoval(productId, listName); // Notify removal for ghost state.
      } else {
        saveToList(productId, listName); // Save the item to the selected list.
      }

      closeMenu(); // Close menu after selection.
    },
    [
      closeMenu,
      isSavedInList,
      notifyRemoval,
      productId,
      removeFromList,
      saveToList,
    ],
  );

  /**
   * Handle creating a new list and saving the item to it.
   */
  const handleCreateList = useCallback(() => {
    const trimmedName = newListName.trim(); // Clean up input text.

    if (!trimmedName) {
      return; // Skip when input is empty.
    }

    const normalizedName = addList(trimmedName); // Create list (or reuse existing).
    saveToList(productId, normalizedName); // Save item into the new list.
    closeMenu(); // Close menu after creation.
  }, [addList, closeMenu, newListName, productId, saveToList]);

  /**
   * Close the menu when clicking outside or pressing escape.
   */
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
      window.removeEventListener("pointerdown", handlePointerDownOutside); // Clean up touch/pointer listener.
      window.removeEventListener("keydown", handleKeyDown); // Clean up listener.
    };
  }, [closeMenu, isMenuOpen]);

  /**
   * Clear timers when the component unmounts.
   */
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
    DEFAULT_WISHLIST_NAME,
    isItemSaved,
    isMenuOpen,
    listNames,
    isSavedInList,
    newListName,
    setNewListName,
    wrapperRef,
    menuId,
    handleClick,
    handleDoubleClick,
    handlePointerDown,
    handlePointerUp,
    handleSelectList,
    handleCreateList,
  };
}
