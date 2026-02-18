"use client";

import RouteErrorFallback from "@/shared/components/error/RouteErrorFallback";

/**
 * Route-level error boundary for /insights.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorFallback
      error={error}
      reset={reset}
      title="Insights failed to load."
      message="We couldn’t load the insights page. Try again or return to the feed."
      backHref="/"
      backLabel="← Back to feed"
    />
  );
}

