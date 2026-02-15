"use client";

import {
  WishlistSyncPayload,
  markWishlistSyncCompleted,
} from "@/features/wishlist/lib/wishlist-sync";
import { requestDataApi } from "@/shared/lib/platform/data-api";

type WishlistSyncResponse = {
  accountId?: string;
  acknowledgedOperationIds?: string[];
};

/**
 * Submit wishlist sync payloads to the SQL-backed data API when configured.
 */
export const syncWishlistPayloadToSql = async (
  payload: WishlistSyncPayload,
) => {
  const response = await requestDataApi<WishlistSyncResponse>({
    path: "/data/wishlist/sync",
    method: "POST",
    body: {
      payload,
    },
  }); // Forward guest/account wishlist state for backend merge.

  if (!response || !response.ok) {
    return { ok: false } as const; // Keep pending operations queued for future retries.
  }

  const acknowledgedOperationIds = Array.isArray(response.data.acknowledgedOperationIds)
    ? response.data.acknowledgedOperationIds.filter(Boolean)
    : [];

  markWishlistSyncCompleted({
    accountId: response.data.accountId ?? payload.accountId,
    acknowledgedOperationIds,
  }); // Acknowledge synced operations in local queue state.

  return {
    ok: true,
    acknowledgedOperationIds,
  } as const;
};
