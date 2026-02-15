"use client";

import { useEffect, useState } from "react";
import { getCommentsByProductId } from "@/shared/lib/engagement/comments";

const COMMENT_STORAGE_KEY = "window_shoppr_product_comments"; // Shared local-storage key for comments.

/**
 * Read visible comment count for a specific product.
 */
export const readProductCommentCount = (productId: string) =>
  getCommentsByProductId(productId).length;

/**
 * Subscribe to a product comment-count with same-tab and cross-tab sync.
 */
export const useProductCommentCount = (productId: string) => {
  const [commentCount, setCommentCount] = useState(() =>
    readProductCommentCount(productId),
  );

  useEffect(() => {
    const syncCount = () => {
      setCommentCount(readProductCommentCount(productId)); // Refresh comment count from local store.
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === COMMENT_STORAGE_KEY) {
        syncCount(); // Sync when another tab updates comments.
      }
    };

    window.addEventListener("comment:submit", syncCount);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("comment:submit", syncCount);
      window.removeEventListener("storage", handleStorage);
    };
  }, [productId]);

  return commentCount;
};
