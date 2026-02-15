/* eslint-disable @next/next/no-img-element */
"use client";

import { toAssetPath } from "@/shared/lib/catalog/assets";
import {
  formatDealTimeRemaining,
  isDealWindowActive,
} from "@/shared/lib/catalog/deals";
import { Product } from "@/shared/lib/catalog/types";
import {
  formatCompactCount,
  SOCIAL_PROOF_MIN_COUNT,
  useProductSaveCount,
} from "@/shared/lib/engagement/social-proof";
import { useProductCommentCount } from "@/shared/lib/engagement/comment-counts";
import CommentIcon from "@/shared/components/icons/CommentIcon";
import TimerIcon from "@/shared/components/icons/TimerIcon";
import ProductCardShareButton from "@/shared/components/product-card/ProductCardShareButton";
import styles from "@/shared/components/product-card/ProductCard.module.css";

/**
 * Format a numeric price into a USD string.
 */
const formatPrice = (price: number) => `$${price.toFixed(2)}`;

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
  const hasPriceDeal =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price; // Determine if strike price should show.
  const isDealActive = isDealWindowActive(product.dealEndsAt); // Disable deal-only UI once expiration is in the past.
  const hasDeal = hasPriceDeal && isDealActive; // Show strike pricing only while the deal window is active.
  const dealLabel = formatDealTimeRemaining(product.dealEndsAt); // Compute active deal timer when available.
  const showDealBadge = Boolean(dealLabel); // Show badge only when a concrete remaining-time label exists.
  const compactDealLabel = dealLabel?.replace(/^Ends in\s+/i, "") ?? null; // Show compact countdown copy on cards.
  const imageSrc = toAssetPath(product.images[0] ?? "/images/product-placeholder.svg"); // Use first image or fallback.
  const isCompact = variant === "compact"; // Toggle compact styling for dense layouts.
  const saveCount = useProductSaveCount(product.id, product.saveCount ?? 0); // Subscribe to live save-count updates for this product.
  const commentCount = useProductCommentCount(product.id); // Subscribe to local comment count updates.
  const showSaveCount = saveCount >= SOCIAL_PROOF_MIN_COUNT; // Hide weak social proof until count crosses the trust threshold.
  const showCommentCount = commentCount >= SOCIAL_PROOF_MIN_COUNT; // Hide weak social proof until count crosses the trust threshold.

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
        {showDealBadge ? (
          <span className={styles.productCard__badge}>
            <span className={styles.productCard__badgeIcon} aria-hidden="true">
              <TimerIcon />
            </span>
            <span>{compactDealLabel}</span>
          </span>
        ) : null}
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
          <span className={styles.productCard__meta}>
            {product.retailer || product.category}
          </span>
        ) : null}
      </div>

      {/* Price section with optional strike-through and social actions. */}
      <div className={styles.productCard__priceSection}>
        {/* Price column with optional strike price. */}
        <div className={styles.productCard__priceColumn}>
          <div className={styles.productCard__priceRow}>
            <span className={styles.productCard__price}>
              {formatPrice(product.price)}
            </span>
            {hasDeal && (
              <span className={styles.productCard__originalPrice}>
                {formatPrice(product.originalPrice ?? product.price)}
              </span>
            )}
          </div>
        </div>

        <div className={styles.productCard__actions}>
          <div className={styles.productCard__socialGroup}>
            {showSaveCount ? (
              <span className={styles.productCard__socialCount}>
                {formatCompactCount(saveCount)}
              </span>
            ) : null}

            {/* Save button injected by the parent feature (wishlist/feed). */}
            {renderSaveButton
              ? renderSaveButton({
                  buttonClassName: styles.productCard__wishlist, // Base button styles.
                  savedClassName: styles["productCard__wishlist--saved"], // Saved-state styles.
                  wrapperClassName: styles.productCard__wishlistWrap, // Positioning wrapper styles.
                })
              : null}
          </div>

          <div className={styles.productCard__socialGroup}>
            {showCommentCount ? (
              <span className={styles.productCard__socialCount}>
                {formatCompactCount(commentCount)}
              </span>
            ) : null}

            <span className={styles.productCard__commentIcon} aria-hidden="true">
              <CommentIcon />
            </span>
          </div>

          {/* Save button injected by the parent feature (wishlist/feed). */}
          <ProductCardShareButton
            productName={product.name}
            productSlug={product.slug}
            className={styles.productCard__share}
          />
        </div>
      </div>
    </article>
  );
}
