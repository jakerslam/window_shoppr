"use client";

import Link from "next/link";
import styles from "@/components/product-detail/ProductDetail.module.css";

/**
 * Back navigation button for product detail views.
 */
export default function ProductDetailActions({
  inModal,
  onBack,
}: {
  inModal: boolean;
  onBack: () => void;
}) {
  return inModal ? (
    <button
      className={styles.productDetail__back}
      type="button"
      onClick={onBack} // Close modal when previewing from the feed.
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
  );
}
