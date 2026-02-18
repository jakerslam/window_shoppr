"use client";

import Link from "next/link";
import { useEffect } from "react";
import { trackMonitoringError } from "@/shared/lib/engagement/monitoring";
import styles from "@/shared/components/error/RouteErrorFallback.module.css";

/**
 * Shared route-level error boundary UI.
 */
export default function RouteErrorFallback({
  error,
  reset,
  title = "Something went off track.",
  message = "We hit a snag while loading this view. Try again or return to the feed.",
  backHref = "/",
  backLabel = "← Back to feed",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const showDetails = process.env.NODE_ENV === "development";

  useEffect(() => {
    trackMonitoringError({
      type: "react_error_boundary",
      message: error.message || "Route error boundary triggered",
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className={styles.routeError}>
      <h1 className={styles.routeError__title}>{title}</h1>
      <p className={styles.routeError__text}>{message}</p>

      <div className={styles.routeError__actions}>
        <button
          className={styles.routeError__action}
          type="button"
          onClick={() => reset()}
        >
          Try again
        </button>
        <Link className={styles.routeError__action} href={backHref}>
          {backLabel}
        </Link>
      </div>

      {showDetails ? (
        <p className={styles.routeError__detail}>{error.message}</p>
      ) : null}
    </div>
  );
}

