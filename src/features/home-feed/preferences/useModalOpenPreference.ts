"use client";

import { useEffect } from "react";

/**
 * Listen for global modal open/close events to pause the feed.
 */
export default function useModalOpenPreference({
  setIsModalOpen,
  refreshRecentlyViewed,
}: {
  setIsModalOpen: (value: boolean) => void;
  refreshRecentlyViewed: () => void;
}) {
  useEffect(() => {
    const handleModalToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      const isOpen = Boolean(customEvent.detail?.open);

      setIsModalOpen(isOpen); // Track modal open state.

      if (!isOpen && typeof window !== "undefined") {
        window.setTimeout(() => {
          refreshRecentlyViewed(); // Refresh recently viewed after closing modals.
        }, 0);
      }
    };

    window.addEventListener("modal:toggle", handleModalToggle); // Listen for modal open/close.

    return () => {
      window.removeEventListener("modal:toggle", handleModalToggle); // Clean up listener.
    };
  }, [refreshRecentlyViewed, setIsModalOpen]);
}
