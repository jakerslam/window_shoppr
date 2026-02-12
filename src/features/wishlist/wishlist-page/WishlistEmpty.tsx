"use client";

import Link from "next/link";
import styles from "@/features/wishlist/WishlistPage.module.css";

/**
 * Empty state for when no wishlist items are saved.
 */
export default function WishlistEmpty({
  title,
  message,
  ctaLabel,
  ctaHref,
  onCtaClick,
}: {
  title: string;
  message: string;
  ctaLabel: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}) {
  return (
    <div className={styles.wishlistPage__empty}>
      {/* Empty state headline. */}
      <p className={styles.wishlistPage__emptyTitle}>{title}</p>

      {/* Empty state helper copy. */}
      <p className={styles.wishlistPage__emptyText}>{message}</p>

      {/* Primary call to action. */}
      {ctaHref ? (
        <Link className={styles.wishlistPage__emptyCta} href={ctaHref}>
          {ctaLabel}
        </Link>
      ) : (
        <button
          className={styles.wishlistPage__emptyCta}
          type="button"
          onClick={onCtaClick} // Trigger the empty-state action.
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
