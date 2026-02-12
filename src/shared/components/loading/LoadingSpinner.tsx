import type { CSSProperties } from "react";
import styles from "@/shared/components/loading/LoadingSpinner.module.css";

/**
 * Shared spinner component for route + modal loading states.
 */
export default function LoadingSpinner({
  label = "Loading…",
  size = 28,
}: {
  label?: string;
  size?: number;
}) {
  return (
    <div
      className={styles.loadingSpinner}
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{ "--loading-spinner-size": `${size}px` } as CSSProperties} // Size hook for CSS.
    >
      {/* Animated ring indicator. */}
      <span className={styles.loadingSpinner__ring} aria-hidden="true" />

      {/* Accessible text label. */}
      <span className={styles.loadingSpinner__label}>{label}</span>
    </div>
  );
}
