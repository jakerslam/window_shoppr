import LoadingSpinner from "@/shared/components/loading/LoadingSpinner";
import styles from "@/shared/components/loading/LoadingScreen.module.css";

/**
 * Centered loading screen used by route-level loading fallbacks.
 */
export default function LoadingScreen({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div className={styles.loadingScreen}>
      {/* Shared spinner for route transitions. */}
      <LoadingSpinner label={label} />
    </div>
  );
}
