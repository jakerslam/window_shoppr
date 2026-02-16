"use client";

import { useCallback, useRef, useState } from "react";
import { DEFAULT_WISHLIST_NAME } from "@/features/wishlist/wishlist-constants";
import { useWishlist } from "@/features/wishlist/wishlist";
import useWishlistMenuDismiss from "@/features/wishlist/menu/useWishlistMenuDismiss";
import useWishlistMenuGestures from "@/features/wishlist/menu/useWishlistMenuGestures";
import useWishlistMenuListActions from "@/features/wishlist/menu/useWishlistMenuListActions";

/**
 * Wishlist menu state and handlers for the save button UI.
 */
export default function useWishlistMenu({
  productId,
  activeListName,
  onListRemoval,
  openMenuOnMobileTap,
  openMenuOnDesktopHold,
  enableListMenu,
}: {
  productId: string;
  activeListName?: string;
  onListRemoval?: (productId: string, listName: string) => void;
  openMenuOnMobileTap?: boolean;
  openMenuOnDesktopHold?: boolean;
  enableListMenu?: boolean;
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
  const isItemSaved = isSaved(productId); // Any-list membership for star state.
  const menuId = `wishlist-menu-${productId}`; // Unique id for the dropdown menu.

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

  const {
    openMenu,
    closeMenu,
    handleClick,
    handleDoubleClick,
    handlePointerDown,
    cancelPointerHold,
  } = useWishlistMenuGestures({
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
  }); // Centralize click/press gesture handling.

  const { handleSelectList, handleCreateList } = useWishlistMenuListActions({
    productId,
    newListName,
    addList,
    saveToList,
    removeFromList,
    isSavedInList,
    notifyRemoval,
    closeMenu,
  }); // Wire list selection and list creation actions.

  useWishlistMenuDismiss({
    isMenuOpen,
    wrapperRef,
    closeMenu,
  }); // Close menu on outside clicks + escape.

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
    openMenu,
    closeMenu,
    handleClick,
    handleDoubleClick,
    handlePointerDown,
    cancelPointerHold,
    handleSelectList,
    handleCreateList,
  };
}
