"use client";

import { Product, PRODUCT_UI } from "@/shared/lib/types";
import { trackAffiliateClick } from "@/shared/lib/analytics";
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
  const ratingValue = product.rating ?? 0; // Default to zero for fill calculations.
  const ratingPercent = clamp((ratingValue / 5) * 100, 0, 100); // Convert rating to percent.
  const ratingText = product.rating
    ? `${product.rating.toFixed(1)} / 5 (${product.ratingCount ?? 0})`
    : "No ratings yet"; // Build rating label with reviews.
  const retailerLabel = product.retailer ?? "Retailer"; // Fall back when retailer is unknown.

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
