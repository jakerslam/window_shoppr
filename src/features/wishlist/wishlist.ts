"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_WISHLIST_NAME,
  WISHLIST_EVENT,
  WISHLIST_LEGACY_STORAGE_KEY,
  WISHLIST_LISTS_STORAGE_KEY,
} from "@/features/wishlist/wishlist-constants";


/**
 * Wishlist list data persisted in storage.
 */
type WishlistListsState = {
  order: string[];
  lists: Record<string, string[]>;
};

/**
 * Normalize wishlist ids into a unique, non-empty list.
 */
const normalizeWishlistIds = (ids: string[]) =>
  Array.from(new Set(ids.filter(Boolean))); // Remove empties and duplicates.

/**
 * Normalize list names for consistent storage.
 */
const normalizeListName = (name: string) => name.trim(); // Trim whitespace.

/**
 * Normalize list order and enforce the default list at the top.
 */
const normalizeListOrder = (order: string[]) => {
  const uniqueOrder = Array.from(new Set(order.filter(Boolean))); // Remove empties + dupes.
  const filtered = uniqueOrder.filter((name) => name !== DEFAULT_WISHLIST_NAME); // Drop default for reinsert.

  return [DEFAULT_WISHLIST_NAME, ...filtered]; // Ensure default is always first.
};

/**
 * Build a default wishlist state with a single list.
 */
const buildDefaultState = (ids: string[] = []): WishlistListsState => ({
  order: [DEFAULT_WISHLIST_NAME],
  lists: {
    [DEFAULT_WISHLIST_NAME]: normalizeWishlistIds(ids),
  },
});

/**
 * Read wishlist lists from local storage when available.
 */
const readWishlistListsFromStorage = () => {
  if (typeof window === "undefined") {
    return buildDefaultState(); // Skip storage access during SSR.
  }

  try {
    const raw = window.localStorage.getItem(WISHLIST_LISTS_STORAGE_KEY); // Load stored list data.

    if (!raw) {
      const legacyRaw = window.localStorage.getItem(WISHLIST_LEGACY_STORAGE_KEY); // Load legacy default list.

      if (!legacyRaw) {
        return buildDefaultState(); // Default when nothing stored.
      }

      const legacyParsed = JSON.parse(legacyRaw); // Parse legacy id list.
      const legacyIds = Array.isArray(legacyParsed)
        ? legacyParsed.map(String)
        : [];

      return buildDefaultState(legacyIds); // Seed default list from legacy data.
    }

    const parsed = JSON.parse(raw) as Partial<WishlistListsState>; // Decode stored JSON.
    const lists = parsed.lists ?? {}; // Default to empty lists.
    const order = normalizeListOrder(parsed.order ?? Object.keys(lists)); // Normalize list order.

    if (!lists[DEFAULT_WISHLIST_NAME]) {
      lists[DEFAULT_WISHLIST_NAME] = []; // Ensure default list exists.
    }

    const normalizedLists = Object.fromEntries(
      Object.entries(lists).map(([name, ids]) => [
        name,
        normalizeWishlistIds(Array.isArray(ids) ? ids.map(String) : []),
      ]),
    ); // Normalize all list ids.

    return {
      order,
      lists: normalizedLists,
    };
  } catch (error) {
    console.warn("Unable to read wishlist lists", error); // Log parse/storage issues.
    return buildDefaultState(); // Fall back to default on error.
  }
};

/**
 * Persist wishlist lists to local storage when available.
 */
const writeWishlistListsToStorage = (state: WishlistListsState) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  try {
    const normalizedState = {
      order: normalizeListOrder(state.order),
      lists: Object.fromEntries(
        Object.entries(state.lists).map(([name, ids]) => [
          name,
          normalizeWishlistIds(ids),
        ]),
      ),
    };

    window.localStorage.setItem(
      WISHLIST_LISTS_STORAGE_KEY,
      JSON.stringify(normalizedState),
    ); // Persist list metadata.

    window.localStorage.setItem(
      WISHLIST_LEGACY_STORAGE_KEY,
      JSON.stringify(normalizedState.lists[DEFAULT_WISHLIST_NAME] ?? []),
    ); // Keep legacy key in sync.
  } catch (error) {
    console.warn("Unable to write wishlist lists", error); // Log write issues.
  }
};

/**
 * Broadcast a wishlist update to same-tab listeners.
 */
const broadcastWishlistChange = () => {
  if (typeof window === "undefined") {
    return; // Skip event dispatch during SSR.
  }

  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(WISHLIST_EVENT)); // Notify local listeners.
  }, 0); // Defer to avoid render-phase state updates.
};

/**
 * Shared wishlist state with local storage persistence.
 */
export const useWishlist = () => {
  const [listState, setListState] = useState<WishlistListsState>(() =>
    buildDefaultState(),
  );

  const syncFromStorage = useCallback(() => {
    const storedState = readWishlistListsFromStorage(); // Pull latest list data.
    setListState(storedState); // Update local state with stored lists.
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        syncFromStorage(); // Hydrate from storage on mount.
      }, 0); // Defer to avoid render-phase lint warnings.
    }

    if (typeof window === "undefined") {
      return undefined; // Skip event wiring during SSR.
    }

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === WISHLIST_LISTS_STORAGE_KEY ||
        event.key === WISHLIST_LEGACY_STORAGE_KEY
      ) {
        syncFromStorage(); // Sync when other tabs update storage.
      }
    };

    const handleWishlistChange = () => {
      syncFromStorage(); // Sync when same-tab updates fire.
    };

    window.addEventListener("storage", handleStorage); // Listen for cross-tab changes.
    window.addEventListener(WISHLIST_EVENT, handleWishlistChange); // Listen for local changes.

    return () => {
      window.removeEventListener("storage", handleStorage); // Clean up storage listener.
      window.removeEventListener(WISHLIST_EVENT, handleWishlistChange); // Clean up local listener.
    };
  }, [syncFromStorage]);

  const listNames = useMemo(
    () => normalizeListOrder(listState.order),
    [listState.order],
  ); // Use normalized list order for menus.

  const defaultIds = listState.lists[DEFAULT_WISHLIST_NAME] ?? []; // Default list ids.
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
      return nextState;
    });

    return trimmed; // Return the normalized list name.
  }, []);

  const saveToList = useCallback((id: string, listName: string) => {
    const targetList = normalizeListName(listName) || DEFAULT_WISHLIST_NAME; // Resolve list name.

    setListState((prev) => {
      const currentList = prev.lists[targetList] ?? []; // Load existing ids for list.
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
      return nextState;
    });
  }, []);

  const removeFromList = useCallback((id: string, listName: string) => {
    const targetList = normalizeListName(listName) || DEFAULT_WISHLIST_NAME; // Resolve list name.

    setListState((prev) => {
      const currentList = prev.lists[targetList] ?? []; // Load existing ids for list.
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
