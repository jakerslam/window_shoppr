"use client";

import { toAssetPath } from "@/shared/lib/catalog/assets";
import { SITE_URL } from "@/shared/lib/platform/seo";

/**
 * Lightweight card-level share action with native-share and clipboard fallback.
 */
export default function ProductCardShareButton({
  productName,
  productSlug,
  className,
}: {
  productName: string;
  productSlug: string;
  className: string;
}) {
  /**
   * Copy a URL using modern Clipboard API first and legacy fallback second.
   */
  const copyUrl = async (url: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url); // Use modern clipboard API when available.
      return;
    }

    const hiddenInput = document.createElement("textarea");
    hiddenInput.value = url;
    hiddenInput.setAttribute("readonly", "");
    hiddenInput.style.position = "absolute";
    hiddenInput.style.left = "-9999px";
    document.body.appendChild(hiddenInput);
    hiddenInput.select();
    document.execCommand("copy"); // Fallback for older browser clipboard support.
    document.body.removeChild(hiddenInput);
  };

  /**
   * Share the current product URL without triggering parent card open behavior.
   */
  const handleShare = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Keep this action from opening the product card.

    const shareUrl = `${SITE_URL}${toAssetPath(`/product/${productSlug}/`)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: productName,
          text: `Check out ${productName} on Window Shoppr`,
          url: shareUrl,
        }); // Prefer native share sheet when available.
        return;
      }

      await copyUrl(shareUrl); // Fallback to clipboard copy when native share is unavailable.
    } catch {
      // Ignore canceled share/clipboard errors to keep card interactions uninterrupted.
    }
  };

  return (
    <button
      className={className}
      type="button"
      aria-label="Share product link"
      onClick={handleShare}
    >
      ↗
    </button>
  );
}
