"use client";

import { useCallback, useMemo, useState } from "react";
import { SITE_URL } from "@/shared/lib/platform/seo";
import styles from "@/features/product-detail/ProductDetail.module.css";

/**
 * Share button with native Web Share fallback to clipboard copy.
 */
export default function ProductDetailShareButton({
  productName,
  productSlug,
}: {
  productName: string;
  productSlug: string;
}) {
  const [statusLabel, setStatusLabel] = useState("Share"); // Keep button label contextual after actions.
  const shareUrl = useMemo(
    () => `${SITE_URL}/product/${productSlug}`,
    [productSlug],
  ); // Build canonical share URL for this product.

  /**
   * Reset transient button feedback text after a short delay.
   */
  const scheduleStatusReset = useCallback(() => {
    window.setTimeout(() => {
      setStatusLabel("Share"); // Restore default label after feedback.
    }, 1800);
  }, []);

  /**
   * Copy the product URL to clipboard with legacy fallback.
   */
  const copyToClipboard = useCallback(async () => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl); // Use async clipboard API when available.
      return;
    }

    const hiddenInput = document.createElement("textarea");
    hiddenInput.value = shareUrl; // Set fallback text payload.
    hiddenInput.setAttribute("readonly", "");
    hiddenInput.style.position = "absolute";
    hiddenInput.style.left = "-9999px";
    document.body.appendChild(hiddenInput);
    hiddenInput.select();
    document.execCommand("copy"); // Legacy fallback for older browsers.
    document.body.removeChild(hiddenInput);
  }, [shareUrl]);

  /**
   * Run native share when supported, else copy URL to clipboard.
   */
  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: productName,
          text: `Check out ${productName} on Window Shoppr`,
          url: shareUrl,
        }); // Open native share sheet first.
        setStatusLabel("Shared");
        scheduleStatusReset();
        return;
      }

      await copyToClipboard(); // Fallback when native share is unavailable.
      setStatusLabel("Link copied");
      scheduleStatusReset();
    } catch (error: unknown) {
      const aborted = typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name?: string }).name === "AbortError";

      if (!aborted) {
        setStatusLabel("Could not share"); // Surface non-abort share failures.
        scheduleStatusReset();
      }
    }
  }, [copyToClipboard, productName, scheduleStatusReset, shareUrl]);

  return (
    <button
      className={styles.productDetail__share}
      type="button"
      onClick={handleShare} // Trigger native share or clipboard fallback.
      aria-label="Share product link"
    >
      {statusLabel}
    </button>
  );
}

