"use client";

import RouteErrorFallback from "@/shared/components/error/RouteErrorFallback";

/**
 * Route-level error boundary for /product/[slug].
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
      title="Product view failed to load."
      message="We couldn’t load this product right now. Try again or go back to browsing."
      backHref="/"
      backLabel="← Back to feed"
    />
  );
}

