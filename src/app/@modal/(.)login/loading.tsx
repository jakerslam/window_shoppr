import LoadingScreen from "@/shared/components/loading/LoadingScreen";

/**
 * Modal loading fallback while login UI is streaming.
 */
export default function Loading() {
  return (
    <>
      {/* Full-page loading state while login content streams. */}
      <LoadingScreen label="Loading login…" />
    </>
  );
}
