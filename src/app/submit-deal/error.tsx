"use client";

import RouteErrorFallback from "@/shared/components/error/RouteErrorFallback";

/**
 * Route-level error boundary for /submit-deal.
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
      title="Deal submission failed to load."
      message="We couldn’t load the submit-deal view. Try again or return to the feed."
      backHref="/"
      backLabel="← Back to feed"
    />
  );
}

