"use client";

import RouteErrorFallback from "@/shared/components/error/RouteErrorFallback";

/**
 * Route-level error boundary for /login.
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
      title="Login failed to load."
      message="We couldn’t load the login view. Try again or return to the feed."
      backHref="/"
      backLabel="← Back to feed"
    />
  );
}

