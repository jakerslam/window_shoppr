"use client";

import { Product, PRODUCT_UI } from "@/shared/lib/catalog/types";
import { trackAffiliateClick } from "@/shared/lib/engagement/analytics";
import {
  formatCompactCount,
  formatSaveCountLabel,
  SOCIAL_PROOF_MIN_COUNT,
  useProductSaveCount,
} from "@/shared/lib/engagement/social-proof";
import {
  awardWindowPoints,
  buildDailyWindowPointsKey,
} from "@/shared/lib/engagement/window-points";
import { queuePurchaseFollowup } from "@/shared/lib/engagement/purchase-followup";
import DescriptionToggle from "@/features/product-detail/DescriptionToggle";
import ProductDetailShareButton from "@/features/product-detail/ProductDetailShareButton";
import ProductDetailComments from "@/features/product-detail/info/ProductDetailComments";
import ProductDetailReport from "@/features/product-detail/info/ProductDetailReport";
import ProductDetailTaste from "@/features/product-detail/info/ProductDetailTaste";
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
  const saveCount = useProductSaveCount(product.id, product.saveCount ?? 0); // Subscribe to live save-count updates for this product.
  const saveCountLabel = formatSaveCountLabel(saveCount); // Render compact social-proof text.
  const showSaveCount = saveCount >= SOCIAL_PROOF_MIN_COUNT; // Hide weak social proof until threshold is met.

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
    awardWindowPoints({
      action: "affiliate_click",
      uniqueKey: buildDailyWindowPointsKey(`affiliate-click:${product.id}`),
    }); // Award one daily click bonus per product.
    queuePurchaseFollowup({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      retailer: product.retailer,
      affiliateUrl: product.affiliateUrl,
    }); // Queue a post-click "did you buy?" follow-up prompt.
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
        {showSaveCount ? (
          <span className={styles.productDetail__saveCount} title={saveCountLabel}>
            {formatCompactCount(saveCount)} ★
          </span>
        ) : null}
      </div>

      <div className={styles.productDetail__actionsRow}>
        <a
          className={styles.productDetail__cta}
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAffiliateClick} // Track affiliate click before navigation.
        >
          Get deal at {retailerLabel}
        </a>

        <ProductDetailShareButton
          productName={product.name}
          productSlug={product.slug}
        />
      </div>

      <DescriptionToggle
        text={product.description}
        characterLimit={PRODUCT_UI.DESCRIPTION_COLLAPSE_LIMIT}
      />

      <ProductDetailTaste product={product} />

      <ProductDetailComments productId={product.id} productSlug={product.slug} />

      <ProductDetailReport productId={product.id} productSlug={product.slug} />

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
