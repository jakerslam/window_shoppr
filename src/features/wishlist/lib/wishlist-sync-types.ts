import { WishlistListsState } from "@/features/wishlist/lib/wishlist-storage";

export type WishlistSyncOperationType = "save" | "remove" | "create_list";

export type WishlistSyncOperation = {
  id: string;
  type: WishlistSyncOperationType;
  productId?: string;
  listName?: string;
  timestamp: string;
};

export type WishlistSyncState = {
  version: 1;
  guestId: string;
  accountId?: string;
  lastSyncAttemptAt?: string;
  lastSyncedAt?: string;
  pendingOperations: WishlistSyncOperation[];
};

export type WishlistSyncPayload = {
  generatedAt: string;
  guestId: string;
  accountId?: string;
  wishlist: WishlistListsState;
  pendingOperations: WishlistSyncOperation[];
};
