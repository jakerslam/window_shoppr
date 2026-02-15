"use client";

import styles from "@/features/home-feed/HomeFeed.module.css";

/**
 * End-of-deck callout shown when the finite feed has been consumed.
 */
export default function HomeFeedEndDeck({
  categoryLabel,
  onReplayDeck,
  onBrowseAllCategories,
}: {
  categoryLabel: string;
  onReplayDeck: () => void;
  onBrowseAllCategories: () => void;
}) {
  return (
    <div className={styles.homeFeed__endDeck} role="status" aria-live="polite">
      <p className={styles.homeFeed__endDeckTitle}>
        You&apos;ve reached the end of our picks for {categoryLabel}.
      </p>
      <p className={styles.homeFeed__endDeckText}>
        Check back soon for fresh finds.
      </p>
      <div className={styles.homeFeed__endDeckActions}>
        <button
          className={styles.homeFeed__endDeckButton}
          type="button"
          onClick={onReplayDeck}
        >
          Start Over
        </button>
        <button
          className={styles.homeFeed__endDeckButton}
          type="button"
          onClick={onBrowseAllCategories}
        >
          Browse All Categories
        </button>
      </div>
    </div>
  );
}
