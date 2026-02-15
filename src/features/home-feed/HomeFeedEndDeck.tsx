"use client";

import styles from "@/features/home-feed/HomeFeed.module.css";

/**
 * End-of-deck callout shown when the finite feed has been consumed.
 */
export default function HomeFeedEndDeck({
  resultCount,
  rewardStatus,
  onReplayDeck,
  onRewardHook,
}: {
  resultCount: number;
  rewardStatus: string;
  onReplayDeck: () => void;
  onRewardHook: () => void;
}) {
  return (
    <div className={styles.homeFeed__endDeck} role="status" aria-live="polite">
      <p className={styles.homeFeed__endDeckTitle}>
        End of {resultCount} curated finds.
      </p>
      <p className={styles.homeFeed__endDeckText}>You reached the end of this deck.</p>
      <div className={styles.homeFeed__endDeckActions}>
        <button
          className={styles.homeFeed__endDeckButton}
          type="button"
          onClick={onReplayDeck}
        >
          Replay deck
        </button>
        <button
          className={styles.homeFeed__endDeckButton}
          type="button"
          onClick={onRewardHook}
        >
          Reward hook
        </button>
      </div>
      {rewardStatus ? (
        <p className={styles.homeFeed__endDeckHint}>{rewardStatus}</p>
      ) : null}
    </div>
  );
}
