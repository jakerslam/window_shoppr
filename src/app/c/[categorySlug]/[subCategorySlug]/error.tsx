"use client";

import RouteErrorFallback from "@/shared/components/error/RouteErrorFallback";

/**
 * Route-level error boundary for /c/[categorySlug]/[subCategorySlug].
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
      title="Subcategory failed to load."
      message="We couldn’t load this subcategory page. Try again or return to the feed."
      backHref="/"
      backLabel="← Back to feed"
    />
  );
}

