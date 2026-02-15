"use client";

import { useCallback, useMemo, useState } from "react";
import useWishlistAccountSync from "@/features/wishlist/lib/useWishlistAccountSync";
import useWishlistStorageSync from "@/features/wishlist/lib/useWishlistStorageSync";
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
import { DEFAULT_WISHLIST_NAME } from "@/features/wishlist/wishlist-constants";
import { trackWishlistEvent } from "@/shared/lib/engagement/analytics";
import { awardWindowPoints } from "@/shared/lib/engagement/window-points";

/**
 * Shared wishlist state with local-first persistence and sync stubs.
 */
export const useWishlist = () => {
  const [listState, setListState] = useState<WishlistListsState>(() =>
    buildDefaultWishlistState(),
  );
  const { enqueueWishlistSyncOperation } = useWishlistAccountSync();

  const syncFromStorage = useCallback(() => {
    setListState(readWishlistListsFromStorage());
  }, []);

  useWishlistStorageSync({ syncFromStorage });

  const listNames = useMemo(
    () => normalizeListOrder(listState.order),
    [listState.order],
  );
  const defaultIds = useMemo(
    () => listState.lists[DEFAULT_WISHLIST_NAME] ?? [],
    [listState.lists],
  );
  const savedIds = useMemo(() => new Set(defaultIds), [defaultIds]);

  const isSaved = useCallback(
    (id: string) =>
      Object.values(listState.lists).some((list) => list.includes(id)),
    [listState.lists],
  );
  const isSavedInList = useCallback(
    (id: string, listName: string) => (listState.lists[listName] ?? []).includes(id),
    [listState.lists],
  );

  const addList = useCallback(
    (name: string) => {
      const trimmed = normalizeListName(name);
      if (!trimmed) {
        return DEFAULT_WISHLIST_NAME;
      }

      setListState((prev) => {
        if (prev.lists[trimmed]) {
          return prev;
        }

        const nextState = {
          order: normalizeListOrder([...prev.order, trimmed]),
          lists: { ...prev.lists, [trimmed]: [] },
        };

        writeWishlistListsToStorage(nextState);
        broadcastWishlistChange();
        trackWishlistEvent({ action: "create_list", listName: trimmed });
        enqueueWishlistSyncOperation({
          nextState,
          operation: { type: "create_list", listName: trimmed },
        });
        return nextState;
      });

      return trimmed;
    },
    [enqueueWishlistSyncOperation],
  );

  const saveToList = useCallback(
    (id: string, listName: string) => {
      const targetList = normalizeListName(listName) || DEFAULT_WISHLIST_NAME;

      setListState((prev) => {
        const currentList = prev.lists[targetList] ?? [];
        if (currentList.includes(id)) {
          return prev;
        }

        const nextState = {
          order: normalizeListOrder(
            prev.order.includes(targetList)
              ? prev.order
              : [...prev.order, targetList],
          ),
          lists: {
            ...prev.lists,
            [targetList]: normalizeWishlistIds([...currentList, id]),
          },
        };

        writeWishlistListsToStorage(nextState);
        broadcastWishlistChange();
        trackWishlistEvent({ action: "save", productId: id, listName: targetList });
        awardWindowPoints({
          action: "wishlist_save",
          uniqueKey: `wishlist-save:${id}`,
        });
        enqueueWishlistSyncOperation({
          nextState,
          operation: { type: "save", productId: id, listName: targetList },
        });
        return nextState;
      });
    },
    [enqueueWishlistSyncOperation],
  );

  const removeFromList = useCallback(
    (id: string, listName: string) => {
      const targetList = normalizeListName(listName) || DEFAULT_WISHLIST_NAME;

      setListState((prev) => {
        const currentList = prev.lists[targetList] ?? [];
        if (!currentList.includes(id)) {
          return prev;
        }

        const nextState = {
          order: normalizeListOrder(prev.order),
          lists: {
            ...prev.lists,
            [targetList]: currentList.filter((entry) => entry !== id),
          },
        };

        writeWishlistListsToStorage(nextState);
        broadcastWishlistChange();
        trackWishlistEvent({ action: "remove", productId: id, listName: targetList });
        enqueueWishlistSyncOperation({
          nextState,
          operation: { type: "remove", productId: id, listName: targetList },
        });
        return nextState;
      });
    },
    [enqueueWishlistSyncOperation],
  );

  const toggleSaved = useCallback(
    (id: string) => {
      setListState((prev) => {
        const isAlreadySaved = Object.values(prev.lists).some((list) =>
          list.includes(id),
        );
        const nextLists = Object.fromEntries(
          Object.entries(prev.lists).map(([name, ids]) => [
            name,
            isAlreadySaved ? ids.filter((entry) => entry !== id) : ids,
          ]),
        );

        if (!isAlreadySaved) {
          const currentList = prev.lists[DEFAULT_WISHLIST_NAME] ?? [];
          nextLists[DEFAULT_WISHLIST_NAME] = normalizeWishlistIds([...currentList, id]);
        }

        const nextState = { order: normalizeListOrder(prev.order), lists: nextLists };
        writeWishlistListsToStorage(nextState);
        broadcastWishlistChange();
        trackWishlistEvent({
          action: isAlreadySaved ? "remove" : "save",
          productId: id,
          listName: isAlreadySaved ? "All" : DEFAULT_WISHLIST_NAME,
        });

        if (!isAlreadySaved) {
          awardWindowPoints({
            action: "wishlist_save",
            uniqueKey: `wishlist-save:${id}`,
          });
        }

        enqueueWishlistSyncOperation({
          nextState,
          operation: {
            type: isAlreadySaved ? "remove" : "save",
            productId: id,
            listName: isAlreadySaved ? "all" : DEFAULT_WISHLIST_NAME,
          },
        });
        return nextState;
      });
    },
    [enqueueWishlistSyncOperation],
  );

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
