"use client";

import { WISHLIST_SYNC_REQUEST_EVENT, WISHLIST_SYNC_STORAGE_KEY } from "@/features/wishlist/wishlist-constants";
import { WishlistListsState, normalizeListOrder, normalizeWishlistIds } from "@/features/wishlist/lib/wishlist-storage";
import {
  WishlistSyncOperation,
  WishlistSyncOperationType,
  WishlistSyncPayload,
  WishlistSyncState,
} from "@/features/wishlist/lib/wishlist-sync-types";

export type {
  WishlistSyncOperation,
  WishlistSyncOperationType,
  WishlistSyncPayload,
  WishlistSyncState,
} from "@/features/wishlist/lib/wishlist-sync-types";

const MAX_PENDING_SYNC_OPERATIONS = 400;
const createGuestId = () => `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const normalizeAccountId = (value?: string) => value?.trim().toLowerCase() || undefined;
const createDefaultSyncState = (): WishlistSyncState => ({ version: 1, guestId: createGuestId(), pendingOperations: [] });

const parseSyncState = (raw: string | null): WishlistSyncState => {
  if (!raw) return createDefaultSyncState();
  try {
    const parsed = JSON.parse(raw) as Partial<WishlistSyncState>;
    const pendingOperations = Array.isArray(parsed.pendingOperations)
      ? parsed.pendingOperations.filter(
          (operation): operation is WishlistSyncOperation =>
            typeof operation?.id === "string" &&
            typeof operation?.type === "string" &&
            typeof operation?.timestamp === "string",
        )
      : [];

    return {
      version: 1,
      guestId: parsed.guestId?.trim() || createGuestId(),
      accountId: normalizeAccountId(parsed.accountId),
      lastSyncAttemptAt: typeof parsed.lastSyncAttemptAt === "string" ? parsed.lastSyncAttemptAt : undefined,
      lastSyncedAt: typeof parsed.lastSyncedAt === "string" ? parsed.lastSyncedAt : undefined,
      pendingOperations: pendingOperations.slice(-MAX_PENDING_SYNC_OPERATIONS),
    };
  } catch {
    return createDefaultSyncState();
  }
};

export const readWishlistSyncState = () => {
  if (typeof window === "undefined") return createDefaultSyncState();
  return parseSyncState(window.localStorage.getItem(WISHLIST_SYNC_STORAGE_KEY));
};

export const writeWishlistSyncState = (state: WishlistSyncState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      WISHLIST_SYNC_STORAGE_KEY,
      JSON.stringify({
        ...state,
        accountId: normalizeAccountId(state.accountId),
        pendingOperations: state.pendingOperations.slice(-MAX_PENDING_SYNC_OPERATIONS),
      }),
    );
  } catch {
    // Ignore storage failures.
  }
};

export const appendWishlistSyncOperation = ({
  type,
  productId,
  listName,
  accountId,
}: {
  type: WishlistSyncOperationType;
  productId?: string;
  listName?: string;
  accountId?: string;
}) => {
  const current = readWishlistSyncState();
  const next: WishlistSyncState = {
    ...current,
    accountId: normalizeAccountId(accountId) ?? current.accountId,
    pendingOperations: [
      ...current.pendingOperations,
      {
        id: `wop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        productId: productId?.trim() || undefined,
        listName: listName?.trim() || undefined,
        timestamp: new Date().toISOString(),
      },
    ].slice(-MAX_PENDING_SYNC_OPERATIONS),
  };
  writeWishlistSyncState(next);
  return next;
};

export const buildWishlistSyncPayload = ({
  listsState,
  accountId,
}: {
  listsState: WishlistListsState;
  accountId?: string;
}): WishlistSyncPayload => {
  const syncState = readWishlistSyncState();
  return {
    generatedAt: new Date().toISOString(),
    guestId: syncState.guestId,
    accountId: normalizeAccountId(accountId) ?? syncState.accountId,
    wishlist: {
      order: normalizeListOrder(listsState.order),
      lists: Object.fromEntries(
        Object.entries(listsState.lists).map(([name, ids]) => [name, normalizeWishlistIds(ids)]),
      ),
    },
    pendingOperations: syncState.pendingOperations,
  };
};

export const requestWishlistAccountSync = ({
  listsState,
  accountId,
  reason,
}: {
  listsState: WishlistListsState;
  accountId?: string;
  reason: "auth_session" | "wishlist_update";
}) => {
  const current = readWishlistSyncState();
  const next = {
    ...current,
    accountId: normalizeAccountId(accountId) ?? current.accountId,
    lastSyncAttemptAt: new Date().toISOString(),
  };
  writeWishlistSyncState(next);

  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(WISHLIST_SYNC_REQUEST_EVENT, {
      detail: {
        reason,
        payload: buildWishlistSyncPayload({ listsState, accountId: next.accountId }),
      },
    }),
  );
};

export const markWishlistSyncCompleted = ({
  accountId,
  acknowledgedOperationIds,
}: {
  accountId?: string;
  acknowledgedOperationIds?: string[];
}) => {
  const current = readWishlistSyncState();
  const acknowledgedSet = new Set(acknowledgedOperationIds ?? []);
  const next: WishlistSyncState = {
    ...current,
    accountId: normalizeAccountId(accountId) ?? current.accountId,
    lastSyncedAt: new Date().toISOString(),
    pendingOperations:
      acknowledgedSet.size > 0
        ? current.pendingOperations.filter((operation) => !acknowledgedSet.has(operation.id))
        : current.pendingOperations,
  };
  writeWishlistSyncState(next);
  return next;
};

export const mergeWishlistWithAccountSnapshot = ({
  localState,
  remoteState,
}: {
  localState: WishlistListsState;
  remoteState: WishlistListsState;
}): WishlistListsState => {
  const mergedLists = { ...remoteState.lists };
  Object.entries(localState.lists).forEach(([name, localIds]) => {
    mergedLists[name] = normalizeWishlistIds([...(mergedLists[name] ?? []), ...localIds]);
  });

  return {
    order: normalizeListOrder([...remoteState.order, ...localState.order]),
    lists: mergedLists,
  };
};
