"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Product } from "@/lib/types";
import styles from "@/components/expanded-card/ExpandedCardOverlay.module.css";

/**
 * Format a numeric price into a USD string.
 */
const formatPrice = (price: number) => `$${price.toFixed(2)}`;

/**
 * Format time remaining until a deal expires.
 */
const formatTimeRemaining = (dealEndsAt?: string) => {
  if (!dealEndsAt) {
    return null; // No timer when deal end is missing.
  }

  const endTime = new Date(dealEndsAt).getTime();
  const diffMs = endTime - Date.now();

  if (Number.isNaN(endTime) || diffMs <= 0) {
    return "Deal ended";
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Ends in ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Ends in ${hours}h ${minutes}m`;
  }

  return `Ends in ${minutes}m`;
};

/**
 * Clamp a numeric value between min and max bounds.
 */
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * In-feed expanded overlay for a product.
 */
export default function ExpandedCardOverlay({
  product,
  style,
  onClose,
  onViewDetails,
  onSave,
  isSaved = false,
}: {
  product: Product;
  style: CSSProperties;
  onClose: () => void;
  onViewDetails: () => void;
  onSave?: (product: Product) => void;
  isSaved?: boolean;
}) {
  const [isActive, setIsActive] = useState(false);

  const dealLabel = useMemo(
    () => formatTimeRemaining(product.dealEndsAt),
    [product.dealEndsAt],
  );

  const ratingValue = product.rating ?? 0;
  const ratingPercent = clamp((ratingValue / 5) * 100, 0, 100);
  const ratingText = product.rating
    ? `${product.rating.toFixed(1)} / 5 (${product.ratingCount ?? 0})`
    : "No ratings yet";

  const mainImage = product.images[0] ?? "/images/sample-01.svg";
  const snippet = product.description.slice(0, 200).trim();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => setIsActive(true));

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={styles.expandedOverlay}>
      {/* Backdrop for click-outside closing. */}
      <div className={styles.expandedOverlay__backdrop} onClick={onClose} />

      {/* Expanded card that stays within the viewport. */}
      <div
        className={`${styles.expandedOverlay__card} ${
          isActive ? styles["expandedOverlay__card--active"] : ""
        }`}
        style={style}
        onClick={onViewDetails}
        role="dialog"
        aria-modal="true"
      >
        {/* Close button for quick dismissal. */}
        <button
          className={styles.expandedOverlay__close}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="Close preview"
        >
          ×
        </button>

        {/* Save button stub pinned bottom-right. */}
        <button
          className={`${styles.expandedOverlay__save} ${
            isSaved ? styles["expandedOverlay__save--saved"] : ""
          }`}
          type="button"
          aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
          onClick={(event) => {
            event.stopPropagation();
            onSave?.(product);
          }}
        >
          {isSaved ? "★" : "☆"}
        </button>

        {/* Image preview for context. */}
        <div className={styles.expandedOverlay__media}>
          <img src={mainImage} alt={product.name} />
        </div>

        {/* Full product name without truncation. */}
        <div className={styles.expandedOverlay__title}>{product.name}</div>

        {/* Rating stars with fill percentage and text. */}
        <div className={styles.expandedOverlay__metaRow}>
          <div className={styles.expandedOverlay__stars} aria-hidden="true">
            <div className={styles.expandedOverlay__starsBase}>★★★★★</div>
            <div
              className={styles.expandedOverlay__starsFill}
              style={{ width: `${ratingPercent}%` }}
            >
              ★★★★★
            </div>
          </div>
          <span className={styles.expandedOverlay__ratingText}>{ratingText}</span>
        </div>

        {/* Price row with optional strike-through and deal time. */}
        <div className={styles.expandedOverlay__priceRow}>
          <span className={styles.expandedOverlay__price}>
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price ? (
            <span className={styles.expandedOverlay__originalPrice}>
              {formatPrice(product.originalPrice)}
            </span>
          ) : null}
          {dealLabel ? (
            <span className={styles.expandedOverlay__dealTime}>{dealLabel}</span>
          ) : null}
        </div>

        {/* Short description snippet for quick context. */}
        <div className={styles.expandedOverlay__snippet}>{snippet}...</div>

        {/* Bottom hint that the card opens full details. */}
        <div className={styles.expandedOverlay__hint}>
          Click anywhere to see full details.
        </div>
      </div>
    </div>
  );
}
