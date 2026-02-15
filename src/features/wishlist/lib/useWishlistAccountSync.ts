"use client";

import { useCallback, useEffect } from "react";
import { readAuthSession } from "@/shared/lib/platform/auth-session";
import {
  appendWishlistSyncOperation,
  requestWishlistAccountSync,
} from "@/features/wishlist/lib/wishlist-sync";
import {
  WishlistListsState,
  readWishlistListsFromStorage,
} from "@/features/wishlist/lib/wishlist-storage";

/**
 * Resolve a stable account id for sync payloads from the auth session stub.
 */
const resolveWishlistAccountId = () => {
  const session = readAuthSession();
  if (!session) {
    return null;
  }

  return session.email?.trim().toLowerCase() || `provider:${session.provider}`;
};

/**
 * Sync helper hook for queueing operations and emitting account-sync requests.
 */
export default function useWishlistAccountSync() {
  const enqueueWishlistSyncOperation = useCallback(
    ({
      nextState,
      operation,
    }: {
      nextState: WishlistListsState;
      operation: {
        type: "save" | "remove" | "create_list";
        productId?: string;
        listName?: string;
      };
    }) => {
      const accountId = resolveWishlistAccountId();
      appendWishlistSyncOperation({
        ...operation,
        accountId: accountId ?? undefined,
      }); // Queue guest operation for eventual server sync.

      if (!accountId) {
        return; // Skip request emission until a user signs in.
      }

      requestWishlistAccountSync({
        listsState: nextState,
        accountId,
        reason: "wishlist_update",
      }); // Emit sync request when account context is present.
    },
    [],
  );

  /**
   * Emit a sync request as soon as an auth session appears.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined; // Skip listener setup during SSR.
    }

    const handleAuthSession = () => {
      const accountId = resolveWishlistAccountId();

      if (!accountId) {
        return; // Ignore sign-out and anonymous states.
      }

      requestWishlistAccountSync({
        listsState: readWishlistListsFromStorage(),
        accountId,
        reason: "auth_session",
      }); // Request account merge when users sign in.
    };

    handleAuthSession(); // Trigger sync on mount when already signed in.
    window.addEventListener("auth:session", handleAuthSession);

    return () => {
      window.removeEventListener("auth:session", handleAuthSession);
    };
  }, []);

  return {
    enqueueWishlistSyncOperation,
  };
}
