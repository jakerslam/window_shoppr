"use client";

import { useCallback, useState } from "react";
import { Product, PRODUCT_UI } from "@/shared/lib/types";
import { submitReport } from "@/shared/lib/reports";
import { trackAffiliateClick } from "@/shared/lib/analytics";
import {
  TastePreferenceSignal,
  applyTasteSignal,
  getTasteProfile,
  writeTasteProfile,
} from "@/shared/lib/taste-profile";
import { PREFERENCE_QUESTION_BANK } from "@/shared/lib/preference-questions";
import DescriptionToggle from "@/features/product-detail/DescriptionToggle";
import styles from "@/features/product-detail/ProductDetail.module.css";
import { clamp, formatPrice } from "@/features/product-detail/product-detail-utils";

/**
 * Product info column with pricing, ratings, and tags.
 */
export default function ProductDetailInfo({
  product,
  showDealBadge,
  dealLabel,
  onTagClick,
  hasDeal,
}: {
  product: Product;
  showDealBadge: boolean;
  dealLabel: string | null;
  onTagClick: (tag: string) => void;
  hasDeal: boolean;
}) {
  const trickleConfig = PREFERENCE_QUESTION_BANK.tasteTrickle; // Data-driven trickle preference copy.
  const ratingValue = product.rating ?? 0; // Default to zero for fill calculations.
  const ratingPercent = clamp((ratingValue / 5) * 100, 0, 100); // Convert rating to percent.
  const ratingText = product.rating
    ? `${product.rating.toFixed(1)} / 5 (${product.ratingCount ?? 0})`
    : "No ratings yet"; // Build rating label with reviews.
  const retailerLabel = product.retailer ?? "Retailer"; // Fall back when retailer is unknown.

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<
    "inaccuracy" | "inappropriate" | "spam" | "other"
  >("inaccuracy");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [tasteSignalStatus, setTasteSignalStatus] = useState<
    "idle" | "liked" | "disliked"
  >("idle");

  /**
   * Toggle the inline report form.
   */
  const handleReportToggle = useCallback(() => {
    setIsReportOpen((prev) => !prev);
  }, []);

  /**
   * Submit a report stub for agent review.
   */
  const handleReportSubmit = useCallback(() => {
    submitReport({
      productId: product.id,
      productSlug: product.slug,
      reason: reportReason,
      details: reportDetails.trim() || undefined,
    });

    setReportSubmitted(true);
    setIsReportOpen(false);
    setReportDetails("");
  }, [product.id, product.slug, reportDetails, reportReason]);

  /**
   * Track outbound affiliate clicks for analytics.
   */
  const handleAffiliateClick = () => {
    trackAffiliateClick({
      productId: product.id,
      productSlug: product.slug,
      retailer: product.retailer,
      affiliateUrl: product.affiliateUrl,
    }); // Store click data for analytics.
  };

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
    <div className={styles.productDetail__info}>
      <h1 className={styles.productDetail__title}>{product.name}</h1>

      <div className={styles.productDetail__priceRow}>
        <span className={styles.productDetail__price}>
          {formatPrice(product.price)}
        </span>
        {hasDeal && (
          <span className={styles.productDetail__originalPrice}>
            {formatPrice(product.originalPrice ?? product.price)}
          </span>
        )}
      </div>

      {showDealBadge ? (
        <div className={styles.productDetail__dealRow}>
          <span className={styles.productDetail__badge}>Deal</span>
          {dealLabel ? (
            <span className={styles.productDetail__dealTime}>{dealLabel}</span>
          ) : null}
        </div>
      ) : null}

      <div className={styles.productDetail__ratingRow}>
        <div className={styles.productDetail__stars} aria-hidden="true">
          <div className={styles.productDetail__starsBase}>★★★★★</div>
          <div
            className={styles.productDetail__starsFill}
            style={{ width: `${ratingPercent}%` }}
          >
            ★★★★★
          </div>
        </div>
        <span className={styles.productDetail__ratingText}>{ratingText}</span>
      </div>

      <a
        className={styles.productDetail__cta}
        href={product.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleAffiliateClick} // Track affiliate click before navigation.
      >
        Get deal at {retailerLabel}
      </a>

      <DescriptionToggle
        text={product.description}
        previewLimit={PRODUCT_UI.DESCRIPTION_PREVIEW_LIMIT}
      />

      {/* Trickle preference capture for local-first personalization. */}
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

      {reportSubmitted ? (
        <p className={styles.productDetail__reportThanks}>Thanks for the report.</p>
      ) : null}

      <div className={styles.productDetail__report}>
        <button
          className={styles.productDetail__reportToggle}
          type="button"
          onClick={handleReportToggle}
        >
          Report this listing
        </button>

        {isReportOpen ? (
          <div className={styles.productDetail__reportForm}>
            <label className={styles.productDetail__reportLabel}>
              Reason
              <select
                className={styles.productDetail__reportSelect}
                value={reportReason}
                onChange={(event) =>
                  setReportReason(event.target.value as typeof reportReason)
                }
              >
                <option value="inaccuracy">Inaccurate info</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="spam">Spam</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className={styles.productDetail__reportLabel}>
              Details (optional)
              <textarea
                className={styles.productDetail__reportInput}
                rows={3}
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
              />
            </label>

            <button
              className={styles.productDetail__reportSubmit}
              type="button"
              onClick={handleReportSubmit}
            >
              Submit report
            </button>
          </div>
        ) : null}
      </div>

      {product.tags && product.tags.length > 0 ? (
        <div className={styles.productDetail__tags}>
          {product.tags.map((tag) => (
            <button
              key={tag}
              className={styles.productDetail__tag}
              type="button"
              onClick={() => onTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
