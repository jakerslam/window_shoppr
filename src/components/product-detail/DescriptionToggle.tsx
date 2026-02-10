"use client";

import { useState } from "react";
import styles from "@/components/product-detail/ProductDetail.module.css";

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

  return (
    <div className={styles.productDetail__description}>
      {/* Description content with optional clamping. */}
      <p
        className={`${styles.productDetail__descriptionText} ${
          !isExpanded && shouldClamp
            ? styles["productDetail__descriptionText--clamped"]
            : ""
        }`}
      >
        {text}
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
