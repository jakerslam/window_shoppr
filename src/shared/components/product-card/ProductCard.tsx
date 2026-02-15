/* eslint-disable @next/next/no-img-element */
"use client";

import { toAssetPath } from "@/shared/lib/catalog/assets";
import { Product } from "@/shared/lib/catalog/types";
import {
  formatSaveCountLabel,
  useProductSaveCount,
} from "@/shared/lib/engagement/social-proof";
import styles from "@/shared/components/product-card/ProductCard.module.css";

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
 * Render props for injecting a save button into the card.
 */
type SaveButtonRenderProps = {
  buttonClassName: string;
  savedClassName: string;
  wrapperClassName: string;
};

const PLACEHOLDER_IMAGE = toAssetPath("/images/product-placeholder.svg");

/**
 * Product card with square image, name, and price section.
 */
export default function ProductCard({
  product,
  onOpen,
  variant = "default", // Choose default density when unspecified.
  renderSaveButton,
}: {
  product: Product;
  onOpen?: (event: React.SyntheticEvent<HTMLElement>) => void;
  variant?: "default" | "compact";
  renderSaveButton?: (props: SaveButtonRenderProps) => React.ReactNode;
}) {
  const hasDeal =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price; // Determine if strike price should show.
  const dealLabel = formatTimeRemaining(product.dealEndsAt); // Compute deal timer when available.
  const showDealBadge = hasDeal || Boolean(dealLabel); // Show badge for active deals.
  const imageSrc = toAssetPath(product.images[0] ?? "/images/product-placeholder.svg"); // Use first image or fallback.
  const isCompact = variant === "compact"; // Toggle compact styling for dense layouts.
  const saveCount = useProductSaveCount(product.id, product.saveCount ?? 0); // Subscribe to live save-count updates for this product.
  const saveCountLabel = formatSaveCountLabel(saveCount); // Render compact human-readable save count text.

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen?.(event); // Trigger open on keyboard activation.
    }
  };

  return (
    <article
      className={`${styles.productCard} ${
        isCompact ? styles["productCard--compact"] : ""
      }`}
      role="button"
      tabIndex={0}
      aria-label={`View ${product.name}`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      {/* Image section kept square regardless of source image ratio. */}
      <div className={styles.productCard__media}>
        {/* Deal badge for discounted items. */}
        {showDealBadge && (
          <span className={styles.productCard__badge}>Deal</span>
        )}
        <img
          className={styles.productCard__image}
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = PLACEHOLDER_IMAGE; // Fall back when remote images fail.
          }}
        />
      </div>

      {/* Name section with optional category context. */}
      <div className={styles.productCard__nameSection}>
        <span className={styles.productCard__name}>{product.name}</span>
        {!isCompact ? ( // Hide category in compact mode.
          <span className={styles.productCard__meta}>{product.category}</span>
        ) : null}
      </div>

      {/* Price section with optional strike-through and wishlist stub. */}
      <div className={styles.productCard__priceSection}>
        {/* Price column with optional deal timer. */}
        <div className={styles.productCard__priceColumn}>
          <div className={styles.productCard__priceRow}>
            <span className={styles.productCard__price}>
              {formatPrice(product.price)}
            </span>
            {hasDeal && !isCompact && ( // Hide strike price in compact mode.
              <span className={styles.productCard__originalPrice}>
                {formatPrice(product.originalPrice ?? product.price)}
              </span>
            )}
          </div>
          {!isCompact ? ( // Hide deal timer in compact mode.
            <span
              className={styles.productCard__dealTime}
              aria-hidden={!dealLabel}
            >
              {dealLabel ?? " "} {/* Reserve space when timer is missing. */}
            </span>
          ) : null}
          <span className={styles.productCard__saveCount}>{saveCountLabel}</span>
        </div>

        {/* Save button injected by the parent feature (wishlist/feed). */}
        {renderSaveButton
          ? renderSaveButton({
              buttonClassName: styles.productCard__wishlist, // Base button styles.
              savedClassName: styles["productCard__wishlist--saved"], // Saved-state styles.
              wrapperClassName: styles.productCard__wishlistWrap, // Positioning wrapper styles.
            })
          : null}
      </div>
    </article>
  );
}
