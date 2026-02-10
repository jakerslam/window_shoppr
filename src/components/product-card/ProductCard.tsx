import { Product } from "@/lib/types";
import styles from "@/components/product-card/ProductCard.module.css";

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
 * Product card with square image, name, and price section.
 */
export default function ProductCard({
  product,
  onOpen,
  onWishlist,
  isSaved = false,
  variant = "default", // Choose default density when unspecified.
}: {
  product: Product;
  onOpen?: (event: React.SyntheticEvent<HTMLElement>) => void;
  onWishlist?: (product: Product) => void;
  isSaved?: boolean;
  variant?: "default" | "compact";
}) {
  const hasDeal =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price; // Determine if strike price should show.
  const dealLabel = formatTimeRemaining(product.dealEndsAt); // Compute deal timer when available.
  const showDealBadge = hasDeal || Boolean(dealLabel); // Show badge for active deals.
  const imageSrc = product.images[0] ?? "/images/sample-01.svg"; // Use first image or fallback.
  const isCompact = variant === "compact"; // Toggle compact styling for dense layouts.

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
        </div>

        <button
          className={`${styles.productCard__wishlist} ${
            isSaved ? styles["productCard__wishlist--saved"] : ""
          }`}
          type="button"
          aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
          onClick={(event) => {
            event.stopPropagation();
            onWishlist?.(product);
          }}
        >
          {isSaved ? "★" : "☆"}
        </button>
      </div>
    </article>
  );
}
