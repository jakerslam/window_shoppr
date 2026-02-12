"use client";

import Link from "next/link";
import styles from "@/app/error.module.css";

/**
 * Global error boundary fallback for unexpected failures.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const showDetails = process.env.NODE_ENV === "development"; // Only show details in dev.

  return (
    <div className={styles.appError}>
      {/* Primary error headline. */}
      <h1 className={styles.appError__title}>Something went off track.</h1>

      {/* Supporting error copy. */}
      <p className={styles.appError__text}>
        We hit a snag while loading this view. Try again or return to the feed.
      </p>

      {/* Recovery actions. */}
      <div className={styles.appError__actions}>
        <button
          className={styles.appError__action}
          type="button"
          onClick={() => reset()} // Retry the route segment.
        >
          Try again
        </button>
        <Link className={styles.appError__action} href="/">
          ← Back to feed
        </Link>
      </div>

      {/* Developer-only error details. */}
      {showDetails ? (
        <p className={styles.appError__detail}>{error.message}</p>
      ) : null}
    </div>
  );
}
