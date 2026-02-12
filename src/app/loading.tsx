import LoadingScreen from "@/shared/components/loading/LoadingScreen";

/**
 * Global app loading fallback during route transitions.
 */
export default function Loading() {
  return <LoadingScreen label="Loading your finds…" />;
}
