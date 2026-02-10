import Link from "next/link";
import { Product, PRODUCT_UI } from "@/lib/types";
import DescriptionToggle from "@/components/product-detail/DescriptionToggle";
import styles from "@/components/product-detail/ProductDetail.module.css";

/**
 * Format a numeric price into a USD string.
 */
const formatPrice = (price: number) => `$${price.toFixed(2)}`;

/**
 * Product detail layout used for both page and modal views.
 */
export default function ProductDetail({
  product,
}: {
  product: Product;
}) {
  const mainImage = product.images[0] ?? "/images/sample-01.svg"; // Use first image or fallback.
  const hasDeal =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price; // Determine if strike price should show.

  return (
    <section className={styles.productDetail}>
      {/* Back navigation to the feed. */}
      <Link className={styles.productDetail__back} href="/">
        &lt; Back to browse
      </Link>

      {/* Main content grid with gallery and info. */}
      <div className={styles.productDetail__content}>
        {/* Gallery column with main image and thumbnails. */}
        <div className={styles.productDetail__gallery}>
          <div className={styles.productDetail__mainImage}>
            <img src={mainImage} alt={product.name} />
          </div>

          <div className={styles.productDetail__thumbs}>
            {product.images.map((image) => (
              <div key={image} className={styles.productDetail__thumb}>
                <img src={image} alt={product.name} />
              </div>
            ))}
          </div>
        </div>

        {/* Info column with title, pricing, and description. */}
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

          <div className={styles.productDetail__rating}>
            {product.rating
              ? `Rating ${product.rating.toFixed(1)} (${product.ratingCount ?? 0})`
              : "No ratings yet"}
          </div>

          <DescriptionToggle
            text={product.description}
            previewLimit={PRODUCT_UI.DESCRIPTION_PREVIEW_LIMIT}
          />
        </div>
      </div>
    </section>
  );
}
