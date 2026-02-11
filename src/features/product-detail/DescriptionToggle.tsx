"use client";

import { useMemo, useState } from "react";
import styles from "@/features/product-detail/ProductDetail.module.css";

/**
 * Description block with optional expand/collapse behavior.
 */
export default function DescriptionToggle({
  text,
  previewLimit,
}: {
  text: string;
  previewLimit: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldClamp = text.length > previewLimit; // Only show toggle when long.

  const previewText = useMemo(() => {
    if (!shouldClamp) {
      return text; // Use full text when short.
    }

    return `${text.slice(0, previewLimit).trim()}...`; // Use preview length.
  }, [previewLimit, shouldClamp, text]);

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
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
