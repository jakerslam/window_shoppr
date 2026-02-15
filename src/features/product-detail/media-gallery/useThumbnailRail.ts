"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ScrollAxis = "x" | "y";

const THUMB_SCROLL_STEP = 72; // Scroll close to one thumbnail per arrow click.

/**
 * Manage thumbnail rail overflow state and navigation behavior.
 */
export default function useThumbnailRail({
  itemCount,
  selectedIndex,
}: {
  itemCount: number;
  selectedIndex: number;
}) {
  const [scrollAxis, setScrollAxis] = useState<ScrollAxis>("y");
  const [canScrollBackward, setCanScrollBackward] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const thumbsRef = useRef<HTMLDivElement | null>(null);
  const thumbButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shouldShowThumbNav = canScrollBackward || canScrollForward; // Only show active nav when overflow exists.

  /**
   * Measure thumbnail overflow and update arrow availability.
   */
  const updateThumbScrollState = useCallback(() => {
    const thumbsNode = thumbsRef.current;
    if (!thumbsNode) {
      setCanScrollBackward(false); // Disable nav when rail is unavailable.
      setCanScrollForward(false); // Disable nav when rail is unavailable.
      return;
    }

    const horizontalOverflow =
      thumbsNode.scrollWidth - thumbsNode.clientWidth; // Detect x-axis overflow.
    const verticalOverflow =
      thumbsNode.scrollHeight - thumbsNode.clientHeight; // Detect y-axis overflow.
    const nextAxis: ScrollAxis =
      horizontalOverflow > verticalOverflow ? "x" : "y"; // Match navigation axis to current layout.
    setScrollAxis(nextAxis); // Keep nav icons aligned with current axis.

    if (nextAxis === "x") {
      const maxLeft = Math.max(horizontalOverflow, 0);
      setCanScrollBackward(thumbsNode.scrollLeft > 1); // Enable back arrow when not at start.
      setCanScrollForward(thumbsNode.scrollLeft < maxLeft - 1); // Enable forward arrow when not at end.
      return;
    }

    const maxTop = Math.max(verticalOverflow, 0);
    setCanScrollBackward(thumbsNode.scrollTop > 1); // Enable up arrow when not at start.
    setCanScrollForward(thumbsNode.scrollTop < maxTop - 1); // Enable down arrow when not at end.
  }, []);

  /**
   * Scroll thumbnail rail with arrow buttons.
   */
  const handleThumbNav = useCallback(
    (direction: "backward" | "forward") => {
      const thumbsNode = thumbsRef.current;
      if (!thumbsNode) {
        return; // Skip when rail is unavailable.
      }

      const delta =
        direction === "forward" ? THUMB_SCROLL_STEP : -THUMB_SCROLL_STEP;

      if (scrollAxis === "x") {
        thumbsNode.scrollBy({ left: delta, behavior: "smooth" }); // Move horizontal rail.
        return;
      }

      thumbsNode.scrollBy({ top: delta, behavior: "smooth" }); // Move vertical rail.
    },
    [scrollAxis],
  );

  /**
   * Register thumbnail button refs for scroll-into-view behavior.
   */
  const setThumbButtonRef = useCallback(
    (index: number, node: HTMLButtonElement | null) => {
      thumbButtonRefs.current[index] = node; // Track each thumbnail element by index.
    },
    [],
  );

  /**
   * Re-measure overflow whenever media item count changes.
   */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      updateThumbScrollState(); // Defer measurement until DOM is painted.
    }, 0);

    return () => {
      window.clearTimeout(timeoutId); // Cancel deferred measurement during rapid rerenders.
    };
  }, [itemCount, updateThumbScrollState]);

  /**
   * Recalculate rail axis and overflow when viewport size changes.
   */
  useEffect(() => {
    const handleResize = () => {
      updateThumbScrollState(); // Keep arrows and axis in sync with responsive layout changes.
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateThumbScrollState]);

  /**
   * Keep the selected thumbnail visible within the scrollable rail.
   */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      thumbButtonRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      }); // Auto-pan rail to the selected thumbnail.
      updateThumbScrollState(); // Refresh nav availability after scrolling.
    }, 0);

    return () => {
      window.clearTimeout(timeoutId); // Cancel pending sync when selection changes quickly.
    };
  }, [selectedIndex, updateThumbScrollState]);

  return {
    thumbsRef,
    scrollAxis,
    canScrollBackward,
    canScrollForward,
    shouldShowThumbNav,
    updateThumbScrollState,
    handleThumbNav,
    setThumbButtonRef,
  };
}

