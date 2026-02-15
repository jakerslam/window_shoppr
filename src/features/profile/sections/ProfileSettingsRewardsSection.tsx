"use client";

import { useEffect, useState } from "react";
import {
  readWindowPointsState,
  requestPointsRedemption,
  WindowPointsState,
} from "@/shared/lib/engagement/window-points";
import styles from "@/features/profile/ProfileSettings.module.css";

/**
 * Rewards section for local-first points and streak visibility.
 */
export default function ProfileSettingsRewardsSection() {
  const [pointsState, setPointsState] = useState<WindowPointsState>(() =>
    readWindowPointsState(),
  );
  const [statusMessage, setStatusMessage] = useState("");

  /**
   * Sync rewards UI with point updates from other components/tabs.
   */
  useEffect(() => {
    const syncState = () => {
      setPointsState(readWindowPointsState()); // Refresh points after local updates.
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "window_shoppr_window_points") {
        syncState(); // Sync when another tab updates rewards state.
      }
    };

    window.addEventListener("window-points:update", syncState);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("window-points:update", syncState);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  /**
   * Trigger redemption stub hook for future backend wiring.
   */
  const handleRedeem = () => {
    const result = requestPointsRedemption();
    setStatusMessage(result.message); // Surface stub response for user feedback.
  };

  return (
    <div className={styles.profileSettings__section}>
      <h3 className={styles.profileSettings__sectionTitle}>Rewards</h3>

      <div className={styles.profileSettings__rewardGrid}>
        <article className={styles.profileSettings__rewardCard}>
          <span className={styles.profileSettings__rewardLabel}>Window points</span>
          <strong className={styles.profileSettings__rewardValue}>
            {pointsState.totalPoints}
          </strong>
        </article>

        <article className={styles.profileSettings__rewardCard}>
          <span className={styles.profileSettings__rewardLabel}>Current streak</span>
          <strong className={styles.profileSettings__rewardValue}>
            {pointsState.currentStreak} day
            {pointsState.currentStreak === 1 ? "" : "s"}
          </strong>
        </article>

        <article className={styles.profileSettings__rewardCard}>
          <span className={styles.profileSettings__rewardLabel}>Best streak</span>
          <strong className={styles.profileSettings__rewardValue}>
            {pointsState.bestStreak} day{pointsState.bestStreak === 1 ? "" : "s"}
          </strong>
        </article>
      </div>

      <p className={styles.profileSettings__hint}>
        Earn points by browsing products, saving finds, and clicking live deals.
      </p>

      <div className={styles.profileSettings__actions}>
        <button
          className={styles.profileSettings__actionButton}
          type="button"
          onClick={handleRedeem}
        >
          Redeem points
        </button>
      </div>

      {statusMessage ? (
        <p className={styles.profileSettings__status} role="status">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
