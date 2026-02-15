"use client";

import type { MutableRefObject } from "react";

/**
 * Hover pause handlers for desktop/trackpad browsing (ignored on touch devices).
 */
export default function useColumnHoverPause({
  isHoveringRef,
  syncPauseState,
}: {
  isHoveringRef: MutableRefObject<boolean>;
  syncPauseState: () => void;
}) {
  /**
   * Determine whether true hover interactions are available.
   */
  const canHover = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  /**
   * Pause the scroll while the pointer is over the column.
   */
  const handleMouseEnter = () => {
    if (!canHover()) {
      return; // Ignore synthetic hover events from touch interactions.
    }

    isHoveringRef.current = true; // Track hover state for modal/menu coordination.
    syncPauseState(); // Pause while hovering.
  };

  /**
   * Resume the scroll with a gentle speed ramp.
   */
  const handleMouseLeave = () => {
    if (!canHover()) {
      return; // Ignore synthetic hover events from touch interactions.
    }

    isHoveringRef.current = false; // Track hover state for modal/menu coordination.
    syncPauseState(); // Resume only when no other pause conditions are active.
  };

  return { handleMouseEnter, handleMouseLeave };
}

