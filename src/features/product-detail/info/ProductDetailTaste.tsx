"use client";

import { useCallback, useState } from "react";
import { Product } from "@/shared/lib/catalog/types";
import {
  TastePreferenceSignal,
  applyTasteSignal,
  getTasteProfile,
  writeTasteProfile,
} from "@/shared/lib/profile/taste-profile";
import { PREFERENCE_QUESTION_BANK } from "@/shared/lib/profile/preference-questions";
import styles from "@/features/product-detail/ProductDetail.module.css";

/**
 * Lightweight preference capture controls ("More like this" / "Less like this").
 */
export default function ProductDetailTaste({ product }: { product: Product }) {
  const trickleConfig = PREFERENCE_QUESTION_BANK.tasteTrickle; // Data-driven trickle preference copy.
  const [tasteSignalStatus, setTasteSignalStatus] = useState<
    "idle" | "liked" | "disliked"
  >("idle");

  /**
   * Store a local-first taste signal to personalize future feed rankings.
   */
  const handleTasteSignal = useCallback(
    (signal: TastePreferenceSignal) => {
      const profile = getTasteProfile(); // Load or create a taste profile payload.

      if (!profile) {
        return; // Skip updates when storage is unavailable.
      }

      const nextProfile = applyTasteSignal(profile, product, signal); // Update weights based on this product.
      writeTasteProfile(nextProfile); // Persist taste profile changes.

      setTasteSignalStatus(signal === "like" ? "liked" : "disliked"); // Show quick feedback.
      window.setTimeout(() => setTasteSignalStatus("idle"), 1600); // Clear status after a short delay.
    },
    [product],
  );

  const tasteStatusLabel =
    tasteSignalStatus === "liked"
      ? trickleConfig.likedStatus
      : tasteSignalStatus === "disliked"
        ? trickleConfig.dislikedStatus
        : ""; // Provide lightweight feedback after clicks.

  return (
    <div className={styles.productDetail__taste}>
      <div className={styles.productDetail__tasteHeader}>
        <span className={styles.productDetail__tasteTitle}>
          {trickleConfig.title}
        </span>
        <span
          className={styles.productDetail__tasteStatus}
          role="status"
          aria-live="polite"
        >
          {tasteStatusLabel}
        </span>
      </div>
      <div className={styles.productDetail__tasteActions}>
        <button
          className={styles.productDetail__tasteButton}
          type="button"
          onClick={() => handleTasteSignal("like")} // Boost this product style in recommendations.
        >
          {trickleConfig.likeLabel}
        </button>
        <button
          className={styles.productDetail__tasteButton}
          type="button"
          onClick={() => handleTasteSignal("dislike")} // Reduce this product style in recommendations.
        >
          {trickleConfig.dislikeLabel}
        </button>
      </div>
    </div>
  );
}

