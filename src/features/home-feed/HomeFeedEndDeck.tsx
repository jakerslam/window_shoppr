"use client";

import styles from "@/features/home-feed/HomeFeed.module.css";

/**
 * End-of-deck callout shown when the finite feed has been consumed.
 */
export default function HomeFeedEndDeck({
  categoryLabel,
  showActions,
  onReplayDeck,
  onBrowseAllCategories,
}: {
  categoryLabel: string;
  showActions: boolean;
  onReplayDeck: () => void;
  onBrowseAllCategories: () => void;
}) {
  return (
    <div className={styles.homeFeed__endDeck} role="status" aria-live="polite">
      <p className={styles.homeFeed__endDeckTitle}>
        End of feed for {categoryLabel}.
      </p>
      <p className={styles.homeFeed__endDeckText}>
        Choose what you want to browse next.
      </p>
      {showActions ? (
        <div className={styles.homeFeed__endDeckActions}>
          <button
            className={styles.homeFeed__endDeckButton}
            type="button"
            onClick={onReplayDeck}
            aria-label="Start over"
          >
            <span className={styles.homeFeed__endDeckButtonText}>Start Over</span>
            <span className={styles.homeFeed__endDeckButtonIcon} aria-hidden="true">
              ↻
            </span>
          </button>
          <button
            className={styles.homeFeed__endDeckButton}
            type="button"
            onClick={onBrowseAllCategories}
          >
            Browse All Categories
          </button>
        </div>
      ) : null}
    </div>
  );
}
