"use client";

import { useCallback, useMemo, useState } from "react";
import { DEFAULT_WISHLIST_NAME } from "@/features/wishlist/wishlist-constants";
import { trackWishlistEvent } from "@/shared/lib/analytics";
import {
  type WishlistListsState,
  broadcastWishlistChange,
  buildDefaultWishlistState,
  normalizeListName,
  normalizeListOrder,
  normalizeWishlistIds,
  readWishlistListsFromStorage,
  writeWishlistListsToStorage,
} from "@/features/wishlist/lib/wishlist-storage";
import useWishlistStorageSync from "@/features/wishlist/lib/useWishlistStorageSync";

/**
 * Shared wishlist state with local storage persistence.
 */
export const useWishlist = () => {
  const [listState, setListState] = useState<WishlistListsState>(() =>
    buildDefaultWishlistState(),
  );

  const syncFromStorage = useCallback(() => {
    const storedState = readWishlistListsFromStorage(); // Pull latest list data.
    setListState(storedState); // Update local state with stored lists.
  }, []);

  useWishlistStorageSync({ syncFromStorage }); // Keep state in sync with storage updates.

  const listNames = useMemo(
    () => normalizeListOrder(listState.order),
    [listState.order],
  ); // Use normalized list order for menus.

  // Memoize default list ids to avoid recreating arrays on every render.
  const defaultIds = useMemo(
    () => listState.lists[DEFAULT_WISHLIST_NAME] ?? [],
    [listState.lists],
  );
  const savedIds = useMemo(
    () => new Set(defaultIds),
    [defaultIds],
  ); // Cached set for default list checks.

  const isSaved = useCallback(
    (id: string) =>
      Object.values(listState.lists).some((list) => list.includes(id)),
    [listState.lists],
  ); // Check if an id is saved in any list.

  const isSavedInList = useCallback(
    (id: string, listName: string) =>
      (listState.lists[listName] ?? []).includes(id),
    [listState.lists],
  ); // Check if an id is saved in a specific list.

  const addList = useCallback((name: string) => {
    const trimmed = normalizeListName(name); // Clean up the list name input.

    if (!trimmed) {
      return DEFAULT_WISHLIST_NAME; // Fall back to the default list name.
    }

    setListState((prev) => {
      if (prev.lists[trimmed]) {
        return prev; // No change when list already exists.
      }

      const nextState = {
        order: normalizeListOrder([...prev.order, trimmed]),
        lists: {
          ...prev.lists,
          [trimmed]: [],
        },
      };

      writeWishlistListsToStorage(nextState); // Persist new list.
      broadcastWishlistChange(); // Notify listeners about new list.
      trackWishlistEvent({ action: "create_list", listName: trimmed }); // Track list creation for analytics.
      return nextState;
    });

    return trimmed; // Return the normalized list name.
  }, []);

  const saveToList = useCallback((id: string, listName: string) => {
    const targetList = normalizeListName(listName) || DEFAULT_WISHLIST_NAME; // Resolve list name.

    setListState((prev) => {
      const currentList = prev.lists[targetList] ?? []; // Load existing ids for list.

      if (currentList.includes(id)) {
        return prev; // Skip storage writes when already saved in this list.
      }

      const updatedList = normalizeWishlistIds([...currentList, id]); // Add id to list.
      const nextState = {
        order: normalizeListOrder(
          prev.order.includes(targetList)
            ? prev.order
            : [...prev.order, targetList],
        ),
        lists: {
          ...prev.lists,
          [targetList]: updatedList,
        },
      };

      writeWishlistListsToStorage(nextState); // Persist updated lists.
      broadcastWishlistChange(); // Notify listeners about list updates.
      trackWishlistEvent({ action: "save", productId: id, listName: targetList }); // Track wishlist saves for analytics.
      return nextState;
    });
  }, []);

  const removeFromList = useCallback((id: string, listName: string) => {
    const targetList = normalizeListName(listName) || DEFAULT_WISHLIST_NAME; // Resolve list name.

    setListState((prev) => {
      const currentList = prev.lists[targetList] ?? []; // Load existing ids for list.

      if (!currentList.includes(id)) {
        return prev; // Skip when the item is not present in the target list.
      }

      const updatedList = currentList.filter((entry) => entry !== id); // Remove id.
      const nextState = {
        order: normalizeListOrder(prev.order),
        lists: {
          ...prev.lists,
          [targetList]: updatedList,
        },
      };

      writeWishlistListsToStorage(nextState); // Persist updated lists.
      broadcastWishlistChange(); // Notify listeners about list updates.
      trackWishlistEvent({ action: "remove", productId: id, listName: targetList }); // Track wishlist removals for analytics.
      return nextState;
    });
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setListState((prev) => {
      const isAlreadySaved = Object.values(prev.lists).some((list) =>
        list.includes(id),
      ); // Detect membership in any list.
      const nextLists = Object.fromEntries(
        Object.entries(prev.lists).map(([name, ids]) => [
          name,
          isAlreadySaved ? ids.filter((entry) => entry !== id) : ids,
        ]),
      ); // Remove id from all lists when already saved.

      if (!isAlreadySaved) {
        const currentList = prev.lists[DEFAULT_WISHLIST_NAME] ?? [];
        nextLists[DEFAULT_WISHLIST_NAME] = normalizeWishlistIds([
          ...currentList,
          id,
        ]); // Add to default list when saving.
      }

      const nextState = {
        order: normalizeListOrder(prev.order),
        lists: nextLists,
      };

      writeWishlistListsToStorage(nextState); // Persist updated lists.
      broadcastWishlistChange(); // Notify listeners about list updates.
      trackWishlistEvent({
        action: isAlreadySaved ? "remove" : "save",
        productId: id,
        listName: isAlreadySaved ? "All" : DEFAULT_WISHLIST_NAME,
      }); // Track wishlist toggles for analytics.
      return nextState;
    });
  }, []);

  return {
    savedIds,
    listNames,
    isSaved,
    isSavedInList,
    addList,
    saveToList,
    removeFromList,
    toggleSaved,
  };
};
