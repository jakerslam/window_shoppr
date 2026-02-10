"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackRecentlyViewed } from "@/lib/recently-viewed";
import { Product, PRODUCT_UI } from "@/lib/types";
import DescriptionToggle from "@/components/product-detail/DescriptionToggle";
import ProductMediaGallery from "@/components/product-detail/ProductMediaGallery";
import styles from "@/components/product-detail/ProductDetail.module.css";

/**
 * Format a numeric price into a USD string.
 */
const formatPrice = (price: number) => `$${price.toFixed(2)}`;

/**
 * Clamp a numeric value between min and max bounds.
 */
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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
 * Product detail layout used for both page and modal views.
 */
export default function ProductDetail({
  product,
  inModal = false,
}: {
  product: Product;
  inModal?: boolean;
}) {
  const router = useRouter();
  const hasDeal =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price; // Determine if strike price should show.
  const dealLabel = formatTimeRemaining(product.dealEndsAt); // Compute deal timer when available.
  const showDealBadge = hasDeal || Boolean(dealLabel); // Show badge for active deals.
  const ratingValue = product.rating ?? 0; // Default to zero for fill calculations.

  // Track recently viewed items for personalization stubs.
  useEffect(() => { // Track viewed items on mount or change.
    trackRecentlyViewed(product.id); // Persist recently viewed state.
  }, [product.id]);
  const ratingPercent = clamp((ratingValue / 5) * 100, 0, 100); // Convert rating to percent.
  const ratingText = product.rating
    ? `${product.rating.toFixed(1)} / 5 (${product.ratingCount ?? 0})`
    : "No ratings yet"; // Build rating label with reviews.
  const retailerLabel = product.retailer ?? "Retailer"; // Fall back when retailer is unknown.

  // Handle back navigation for modal usage.
  const handleBack = () => {
    if (inModal) {
      router.back(); // Close modal by returning to the previous page.
    }
  };

  return (
    <section className={styles.productDetail}>
      {/* Back navigation to the feed or modal close. */}
      {inModal ? (
        <button
          className={styles.productDetail__back}
          type="button"
          onClick={handleBack} // Close modal when previewing from the feed.
          aria-label="Back to feed" // Accessible label for the back button.
        >
          &larr;
        </button>
      ) : (
        <Link
          className={styles.productDetail__back}
          href="/"
          aria-label="Back to feed" // Accessible label for the back link.
        >
          &larr;
        </Link>
      )}

      {/* Main content grid with gallery and info. */}
      <div className={styles.productDetail__content}>
        {/* Media gallery column with thumbnails. */}
        <ProductMediaGallery
          productId={product.id}
          images={product.images}
          videoUrl={product.videoUrl}
          name={product.name}
        />

        {/* Info column with title, pricing, and description. */}
        <div className={styles.productDetail__info}>
          {/* Product title for the detail view. */}
          <h1 className={styles.productDetail__title}>{product.name}</h1>

          {/* Price row with optional strike-through deal price. */}
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

          {/* Deal badge with optional timer text. */}
          {showDealBadge ? (
            <div className={styles.productDetail__dealRow}>
              <span className={styles.productDetail__badge}>Deal</span>
              {dealLabel ? (
                <span className={styles.productDetail__dealTime}>{dealLabel}</span>
              ) : null}
            </div>
          ) : null}

          {/* Rating stars with review count text. */}
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
            <span className={styles.productDetail__ratingText}>
              {ratingText}
            </span>
          </div>

          {/* Primary affiliate call-to-action. */}
          <a
            className={styles.productDetail__cta}
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Get deal at {retailerLabel}
          </a>

          {/* Description with expandable SEO-friendly text. */}
          <DescriptionToggle
            text={product.description}
            previewLimit={PRODUCT_UI.DESCRIPTION_PREVIEW_LIMIT}
          />
        </div>
      </div>
    </section>
  );
}
