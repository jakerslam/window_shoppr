"use client";

import { useCallback } from "react";

/**
 * List selection and list creation actions for the wishlist save menu.
 */
export default function useWishlistMenuListActions({
  productId,
  newListName,
  addList,
  saveToList,
  removeFromList,
  isSavedInList,
  notifyRemoval,
  closeMenu,
}: {
  productId: string;
  newListName: string;
  addList: (name: string) => string;
  saveToList: (id: string, listName: string) => void;
  removeFromList: (id: string, listName: string) => void;
  isSavedInList: (id: string, listName: string) => boolean;
  notifyRemoval: (removedProductId: string, listName: string) => void;
  closeMenu: () => void;
}) {
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

  return { handleSelectList, handleCreateList };
}

