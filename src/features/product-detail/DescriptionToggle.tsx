"use client";

import { useMemo, useState } from "react";
import styles from "@/features/product-detail/ProductDetail.module.css";

/**
 * Description block with optional expand/collapse behavior.
 */
export default function DescriptionToggle({
  text,
  characterLimit,
}: {
  text: string;
  characterLimit: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldClamp = text.length > characterLimit; // Only show toggle when long.

  const previewText = useMemo(() => {
    if (!shouldClamp) {
      return text; // Use full text when short.
    }

    const clamped = text.slice(0, characterLimit).trimEnd(); // Cut to configured character count.
    const lastSpaceIndex = clamped.lastIndexOf(" "); // Prefer ending on a whole word when possible.
    const minWordBoundary = Math.floor(characterLimit * 0.75); // Avoid over-trimming short excerpts.
    const collapsedText =
      lastSpaceIndex > minWordBoundary
        ? clamped.slice(0, lastSpaceIndex).trimEnd()
        : clamped; // Keep readable ending while honoring configured length.

    return `${collapsedText}...`;
  }, [characterLimit, shouldClamp, text]);

  return (
    <div className={styles.productDetail__description}>
      {/* Description content with optional expansion. */}
      <p className={styles.productDetail__descriptionText}>
        {isExpanded ? text : previewText}
      </p>

      {/* Expand/collapse toggle for longer descriptions. */}
      {shouldClamp && (
        <button
          className={styles.productDetail__descriptionToggle}
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}
