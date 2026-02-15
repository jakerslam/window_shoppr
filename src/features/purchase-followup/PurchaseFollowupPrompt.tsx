"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PURCHASE_FOLLOWUP_EVENT,
  postponePurchaseFollowup,
  readNextDuePurchaseFollowup,
  resolvePurchaseFollowup,
} from "@/shared/lib/engagement/purchase-followup";
import styles from "@/features/purchase-followup/PurchaseFollowupPrompt.module.css";

type FollowupPromptState = {
  id: string;
  productName: string;
  retailer?: string;
} | null;

/**
 * Inline follow-up prompt asking if affiliate outbound clicks converted.
 */
export default function PurchaseFollowupPrompt() {
  const [followup, setFollowup] = useState<FollowupPromptState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  /**
   * Load the next due follow-up item from storage.
   */
  const syncFollowup = useCallback(() => {
    const next = readNextDuePurchaseFollowup();
    setFollowup(
      next
        ? {
            id: next.id,
            productName: next.productName,
            retailer: next.retailer,
          }
        : null,
    ); // Display only when a due follow-up exists.
  }, []);

  /**
   * Handle follow-up answer submissions.
   */
  const handleResolve = useCallback(
    async (intent: "bought" | "not_now") => {
      if (!followup) {
        return; // Ignore stale clicks when no prompt is active.
      }

      setIsSubmitting(true); // Lock actions while persisting the response.
      await resolvePurchaseFollowup({ followupId: followup.id, intent });
      setStatusMessage(
        intent === "bought"
          ? "Thanks. We will remind you to leave a review later."
          : "Got it. We will stop asking about this product.",
      ); // Confirm response outcome.
      setIsSubmitting(false);
      window.setTimeout(() => {
        setStatusMessage("");
        syncFollowup(); // Move to the next due prompt.
      }, 1000);
    },
    [followup, syncFollowup],
  );

  /**
   * Defer the active prompt for a later reminder window.
   */
  const handleLater = useCallback(() => {
    if (!followup) {
      return; // Ignore stale clicks when no prompt is active.
    }

    postponePurchaseFollowup(followup.id); // Re-schedule prompt for tomorrow.
    syncFollowup(); // Refresh prompt state.
  }, [followup, syncFollowup]);

  useEffect(() => {
    const initTimeoutId = window.setTimeout(() => {
      syncFollowup(); // Prime initial prompt state on mount.
    }, 0); // Defer initial state hydration to avoid set-state-in-effect lint warnings.

    const handleStorage = (event: StorageEvent) => {
      if (event.key?.includes("window_shoppr_purchase_")) {
        syncFollowup(); // Keep prompt state in sync across tabs.
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncFollowup(); // Re-check due prompts when users return to the tab.
      }
    };

    window.addEventListener(PURCHASE_FOLLOWUP_EVENT, syncFollowup);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncFollowup);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearTimeout(initTimeoutId); // Clean up deferred initial sync.
      window.removeEventListener(PURCHASE_FOLLOWUP_EVENT, syncFollowup);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncFollowup);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [syncFollowup]);

  if (!followup) {
    return null; // Render nothing when no follow-up is due.
  }

  const retailerLabel = followup.retailer ? ` at ${followup.retailer}` : "";

  return (
    <section className={styles.purchaseFollowup} aria-live="polite" aria-label="Purchase follow-up">
      <h2 className={styles.purchaseFollowup__title}>
        Did you buy {followup.productName}
        {retailerLabel}?
      </h2>
      <p className={styles.purchaseFollowup__body}>
        Your answer helps us improve recommendations and decide when to request reviews.
      </p>

      <div className={styles.purchaseFollowup__actions}>
        <button
          className={`${styles.purchaseFollowup__button} ${styles["purchaseFollowup__button--primary"]}`}
          type="button"
          disabled={isSubmitting}
          onClick={() => handleResolve("bought")} // Save a positive conversion response.
        >
          Yes, I bought it
        </button>

        <button
          className={styles.purchaseFollowup__button}
          type="button"
          disabled={isSubmitting}
          onClick={() => handleResolve("not_now")} // Save a non-conversion response.
        >
          Not this time
        </button>

        <button
          className={`${styles.purchaseFollowup__button} ${styles["purchaseFollowup__button--full"]}`}
          type="button"
          disabled={isSubmitting}
          onClick={handleLater} // Re-schedule prompt when users want to answer later.
        >
          Ask me later
        </button>
      </div>

      {statusMessage ? <p className={styles.purchaseFollowup__status}>{statusMessage}</p> : null}
    </section>
  );
}
