"use client";

import { useEffect, useRef } from "react";
import { syncWishlistPayloadToSql } from "@/features/wishlist/lib/wishlist-sql";
import type { WishlistSyncPayload } from "@/features/wishlist/lib/wishlist-sync";
import { WISHLIST_SYNC_REQUEST_EVENT } from "@/features/wishlist/wishlist-constants";

const WISHLIST_SYNC_COALESCE_MS = 500; // Batch rapid save/remove bursts into one sync request.

/**
 * Bridge wishlist sync request events into SQL data API sync attempts.
 */
export default function useWishlistSqlSyncBridge() {
  const pendingPayloadRef = useRef<WishlistSyncPayload | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined; // Skip listener setup during SSR.
    }

    /**
     * Flush the latest queued payload to the SQL sync endpoint.
     */
    const flushPendingSync = async () => {
      if (isSyncingRef.current || !pendingPayloadRef.current) {
        return; // Skip when a request is already in flight or no payload exists.
      }

      const nextPayload = pendingPayloadRef.current;
      pendingPayloadRef.current = null; // Consume queued payload before request.
      isSyncingRef.current = true;
      await syncWishlistPayloadToSql(nextPayload);
      isSyncingRef.current = false;

      if (pendingPayloadRef.current) {
        syncTimeoutRef.current = window.setTimeout(() => {
          void flushPendingSync(); // Flush any payload queued during the last request.
        }, 0);
      }
    };

    const handleSyncRequest = (event: Event) => {
      const customEvent = event as CustomEvent<{
        payload?: WishlistSyncPayload;
      }>;
      const payload = customEvent.detail?.payload;

      if (!payload) {
        return; // Ignore malformed sync events.
      }

      pendingPayloadRef.current = payload; // Keep latest payload while coalescing rapid updates.

      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current); // Reset coalescing timer for burst actions.
      }

      syncTimeoutRef.current = window.setTimeout(() => {
        void flushPendingSync(); // Flush coalesced payload once burst window ends.
      }, WISHLIST_SYNC_COALESCE_MS);
    };

    window.addEventListener(WISHLIST_SYNC_REQUEST_EVENT, handleSyncRequest);

    return () => {
      window.removeEventListener(WISHLIST_SYNC_REQUEST_EVENT, handleSyncRequest);

      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current); // Clean up coalescing timer on unmount.
        syncTimeoutRef.current = null;
      }
    };
  }, []);
}
