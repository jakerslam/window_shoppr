"use client";

import Link from "next/link";
import styles from "@/features/wishlist/WishlistPage.module.css";

/**
 * Empty state for when no wishlist items are saved.
 */
export default function WishlistEmpty() {
  return (
    <div className={styles.wishlistPage__empty}>
      <p className={styles.wishlistPage__emptyText}>
        Your wishlist is empty. Start saving the finds you love most.
      </p>
      <Link className={styles.wishlistPage__emptyCta} href="/">
        &larr; Feed
      </Link>
    </div>
  );
}
