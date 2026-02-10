"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import productsJson from "@/data/products.json";
import { Product } from "@/lib/types";
import { useWishlist } from "@/lib/wishlist";
import ProductCard from "@/components/product-card/ProductCard";
import styles from "@/components/wishlist/WishlistPage.module.css";

/**
 * Static product catalog fallback for wishlist rendering.
 */
const ALL_PRODUCTS = productsJson as Product[]; // Use JSON fallback until SQL wiring.

/**
 * Wishlist page showing saved products in a denser grid.
 */
export default function WishlistPage() {
  const router = useRouter();
  const { savedIds, isSaved, toggleSaved } = useWishlist(); // Pull wishlist state from storage.

  // Build a filtered list of saved products for display.
  const savedProducts = useMemo(() => {
    if (savedIds.size === 0) {
      return []; // Return empty list when nothing is saved.
    }

    return ALL_PRODUCTS.filter((product) => savedIds.has(product.id)); // Match saved ids to products.
  }, [savedIds]);

  const hasItems = savedProducts.length > 0; // Determine whether to show empty state.

  // Navigate to the product detail view when a card is opened.
  const handleOpen = (slug: string) => {
    router.push(`/product/${slug}`); // Route to the full product detail page.
  };

  // Toggle wishlist membership for a product id.
  const handleToggleSaved = (id: string) => {
    toggleSaved(id); // Add or remove the item from the wishlist.
  };

  return (
    <section className={styles.wishlistPage}>
      {/* Header section with title and quick navigation. */}
      <header className={styles.wishlistPage__header}>
        {/* Title group describing the wishlist view. */}
        <div className={styles.wishlistPage__titleGroup}>
          <h1 className={styles.wishlistPage__title}>Your Wishlist</h1>
          <p className={styles.wishlistPage__subtitle}>
            Saved finds for quick, cozy browsing.
          </p>
        </div>

        {/* Action button linking back to the main feed. */}
        <div className={styles.wishlistPage__actions}>
          <Link className={styles.wishlistPage__browse} href="/">
            &larr; Feed
          </Link>
        </div>
      </header>

      {/* Wishlist grid when items are saved. */}
      {hasItems ? (
        <div className={styles.wishlistPage__grid}>
          {/* Render each saved product card. */}
          {savedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpen={() => handleOpen(product.slug)}
              onWishlist={() => handleToggleSaved(product.id)}
              isSaved={isSaved(product.id)}
              variant="compact"
            />
          ))}
        </div>
      ) : (
        <div className={styles.wishlistPage__empty}>
          <p className={styles.wishlistPage__emptyText}>
            Your wishlist is empty. Start saving the finds you love most.
          </p>
          <Link className={styles.wishlistPage__emptyCta} href="/">
            &larr; Feed
          </Link>
        </div>
      )}
    </section>
  );
}
