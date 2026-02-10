import Link from "next/link";
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
 * Product detail layout used for both page and modal views.
 */
export default function ProductDetail({
  product,
}: {
  product: Product;
}) {
  const hasDeal =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price; // Determine if strike price should show.
  const ratingValue = product.rating ?? 0; // Default to zero for fill calculations.
  const ratingPercent = clamp((ratingValue / 5) * 100, 0, 100); // Convert rating to percent.
  const ratingText = product.rating
    ? `${product.rating.toFixed(1)} / 5 (${product.ratingCount ?? 0})`
    : "No ratings yet"; // Build rating label with reviews.
  const retailerLabel = product.retailer ?? "Retailer"; // Fall back when retailer is unknown.

  return (
    <section className={styles.productDetail}>
      {/* Back navigation to the feed. */}
      <Link className={styles.productDetail__back} href="/">
        &lt; Back to browse
      </Link>

      {/* Main content grid with gallery and info. */}
      <div className={styles.productDetail__content}>
        {/* Media gallery column with thumbnails. */}
        <ProductMediaGallery
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
