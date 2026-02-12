import LoadingScreen from "@/shared/components/loading/LoadingScreen";

/**
 * Modal loading fallback while product details are streaming.
 */
export default function Loading() {
  return (
    <>
      {/* Full-page loading state while product content streams. */}
      <LoadingScreen label="Loading product…" />
    </>
  );
}
