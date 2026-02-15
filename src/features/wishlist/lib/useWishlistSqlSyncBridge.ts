"use client";

import { useEffect } from "react";
import { syncWishlistPayloadToSql } from "@/features/wishlist/lib/wishlist-sql";
import type { WishlistSyncPayload } from "@/features/wishlist/lib/wishlist-sync";
import { WISHLIST_SYNC_REQUEST_EVENT } from "@/features/wishlist/wishlist-constants";

/**
 * Bridge wishlist sync request events into SQL data API sync attempts.
 */
export default function useWishlistSqlSyncBridge() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined; // Skip listener setup during SSR.
    }

    const handleSyncRequest = (event: Event) => {
      const customEvent = event as CustomEvent<{
        payload?: WishlistSyncPayload;
      }>;
      const payload = customEvent.detail?.payload;

      if (!payload) {
        return; // Ignore malformed sync events.
      }

      void syncWishlistPayloadToSql(payload); // Attempt remote sync without blocking UI actions.
    };

    window.addEventListener(WISHLIST_SYNC_REQUEST_EVENT, handleSyncRequest);

    return () => {
      window.removeEventListener(WISHLIST_SYNC_REQUEST_EVENT, handleSyncRequest);
    };
  }, []);
}
