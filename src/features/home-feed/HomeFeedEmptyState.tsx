"use client";

import styles from "@/features/home-feed/HomeFeed.module.css";

/**
 * Empty state for the feed when no products match active filters.
 */
export default function HomeFeedEmptyState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <div className={styles.homeFeed__empty}>
      {/* Empty state headline. */}
      <p className={styles.homeFeed__emptyTitle}>No results yet.</p>

      {/* Empty state helper copy. */}
      <p className={styles.homeFeed__emptyText}>
        Try clearing filters or searching something new.
      </p>

      {/* Action to reset filters. */}
      <button
        className={styles.homeFeed__emptyAction}
        type="button"
        onClick={onClearFilters}
      >
        Clear filters
      </button>
    </div>
  );
}
