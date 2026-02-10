import { Product } from "@/lib/types";
import styles from "@/components/product-card/ProductCard.module.css";

/**
 * Format a numeric price into a USD string.
 */
const formatPrice = (price: number) => `$${price.toFixed(2)}`;

/**
 * Product card with square image, name, and price section.
 */
export default function ProductCard({ product }: { product: Product }) {
  const hasDeal =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price; // Determine if strike price should show.
  const imageSrc = product.images[0] ?? "/images/sample-01.svg"; // Use first image or fallback.

  return (
    <article className={styles.productCard}>
      {/* Image section kept square regardless of source image ratio. */}
      <div className={styles.productCard__media}>
        <img
          className={styles.productCard__image}
          src={imageSrc}
          alt={product.name}
        />
      </div>

      {/* Name section with category context. */}
      <div className={styles.productCard__nameSection}>
        <span className={styles.productCard__name}>{product.name}</span>
        <span className={styles.productCard__meta}>{product.category}</span>
      </div>

      {/* Price section with optional strike-through and wishlist stub. */}
      <div className={styles.productCard__priceSection}>
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

        <button
          className={styles.productCard__wishlist}
          type="button"
          aria-label="Save to wishlist"
        >
          ☆
        </button>
      </div>
    </article>
  );
}
