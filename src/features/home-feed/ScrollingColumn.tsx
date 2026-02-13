"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Product } from "@/shared/lib/types";
import ProductCard from "@/shared/components/product-card/ProductCard";
import WishlistSaveButton from "@/features/wishlist/WishlistSaveButton";
import styles from "@/features/home-feed/HomeFeed.module.css";

/**
 * Render props for the wishlist save button.
 */
type SaveButtonRenderProps = {
  buttonClassName: string;
  savedClassName: string;
  wrapperClassName: string;
};

/**
 * Create a named renderer to satisfy display-name linting.
 */
const createSaveRenderer = (productId: string) =>
  function SaveButtonRenderer({
    buttonClassName,
    savedClassName,
    wrapperClassName,
  }: SaveButtonRenderProps) {
    return (
      <WishlistSaveButton
        productId={productId}
        buttonClassName={buttonClassName} // Match card button styling.
        savedClassName={savedClassName} // Apply saved-state styling.
        wrapperClassName={wrapperClassName} // Preserve card layout spacing.
      />
    );
  };

/**
 * Scrolling column of product cards with hover pause + smooth resume.
 */
export default function ScrollingColumn({
  deck,
  duration,
  onOpen,
  isModalOpen,
}: {
  deck: Product[];
  duration: number;
  onOpen: (product: Product) => () => void;
  isModalOpen: boolean;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const loopHeightRef = useRef(0);
  const baseSpeedRef = useRef(0);
  const speedRef = useRef(0);
  const targetSpeedRef = useRef(0);
  const isPausedRef = useRef(false);
  const isHoveringRef = useRef(false);
  const isModalOpenRef = useRef(false);
  const durationRef = useRef(duration);
  const animateRef = useRef<(time: number) => void>(() => undefined);

  const loopedDeck = useMemo(() => [...deck, ...deck], [deck]);

  // Memoize open handlers so cards do not receive new callbacks on every render.
  const openHandlers = useMemo(
    () => loopedDeck.map((product) => onOpen(product)),
    [loopedDeck, onOpen],
  );

  // Memoize save button renderers to avoid recreating per-card callbacks.
  const saveButtonRenderers = useMemo(
    () => loopedDeck.map((product) => createSaveRenderer(product.id)),
    [loopedDeck],
  );

  /**
   * Determine whether true hover interactions are available.
   */
  const canHover = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  /**
   * Measure the track height and recompute the scroll speed.
   */
  const syncMetrics = useCallback(() => {
    const track = trackRef.current;

    if (!track) {
      return; // Skip when the track is not mounted yet.
    }

    const totalHeight = track.getBoundingClientRect().height; // Full height of the looped deck.
    const loopHeight = totalHeight / 2; // One full deck height.

    if (!loopHeight) {
      return; // Skip when layout has no measurable height.
    }

    const wasPaused = isPausedRef.current; // Preserve hover pause state.

    loopHeightRef.current = loopHeight; // Cache the loop height for animation.
    baseSpeedRef.current = loopHeight / durationRef.current; // Compute pixels per second.
    targetSpeedRef.current = wasPaused ? 0 : baseSpeedRef.current; // Keep pause state intact.

    if (wasPaused) {
      speedRef.current = 0; // Ensure the track stays stopped when paused.
    }
  }, []);

  /**
   * Animate the column by translating the track on each frame.
   */
  const animate = useCallback((time: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time; // Seed the previous time for delta math.
    }

    const deltaSeconds = (time - lastTimeRef.current) / 1000; // Convert to seconds.
    lastTimeRef.current = time; // Store the current frame time.

    const loopHeight = loopHeightRef.current; // Height of a full deck loop.
    const track = trackRef.current; // DOM node to move.

    if (track && loopHeight > 0) {
      const speedDelta = (targetSpeedRef.current - speedRef.current) * 0.08; // Ease toward target speed.
      const nextSpeed = speedRef.current + speedDelta; // Apply speed easing.
      const nextPosition =
        (positionRef.current + nextSpeed * deltaSeconds) % loopHeight; // Wrap position.

      speedRef.current = nextSpeed; // Update the current speed.
      positionRef.current = nextPosition; // Cache the current position.
      track.style.transform = `translateY(-${nextPosition}px)`; // Move the track.
    }

    animationRef.current = window.requestAnimationFrame((nextTime) =>
      animateRef.current(nextTime),
    ); // Schedule next frame via ref to satisfy hook linting.
  }, []);

  // Keep the animation ref synced to the latest callback.
  useEffect(() => {
    animateRef.current = animate; // Allow requestAnimationFrame recursion without direct self-reference.
  }, [animate]);

  /**
   * Pause the scroll while the pointer is over the column.
   */
  const handleMouseEnter = () => {
    if (!canHover()) {
      return; // Ignore synthetic hover events from touch interactions.
    }

    isHoveringRef.current = true; // Track hover state for modal coordination.
    isPausedRef.current = true; // Track pause state for resizes.
    targetSpeedRef.current = 0; // Ease to a stop on hover.
  };

  /**
   * Resume the scroll with a gentle speed ramp.
   */
  const handleMouseLeave = () => {
    if (!canHover()) {
      return; // Ignore synthetic hover events from touch interactions.
    }

    isHoveringRef.current = false; // Track hover state for modal coordination.

    if (isModalOpenRef.current) {
      isPausedRef.current = true; // Keep paused when a modal is open.
      targetSpeedRef.current = 0; // Stay stopped until modal closes.
      return;
    }

    isPausedRef.current = false; // Track resume state for resizes.
    targetSpeedRef.current = baseSpeedRef.current; // Ease back to the base speed.
  };

  // Pause the scroll whenever a modal is open.
  useEffect(() => {
    isModalOpenRef.current = isModalOpen; // Keep modal state in sync.

    if (isModalOpen) {
      isPausedRef.current = true; // Pause while a modal is open.
      targetSpeedRef.current = 0; // Stop moving under the modal.
      return;
    }

    if (!isHoveringRef.current) {
      isPausedRef.current = false; // Resume if the user is not hovering.
      targetSpeedRef.current = baseSpeedRef.current; // Return to base speed.
    }
  }, [isModalOpen]);

  // Update scroll speed whenever the duration changes.
  useEffect(() => {
    durationRef.current = duration; // Track the latest duration value.
    syncMetrics(); // Recompute speeds without resetting position.
  }, [duration, syncMetrics]);

  // Reset position whenever the deck changes.
  useEffect(() => {
    positionRef.current = 0; // Start new decks at the top.
    lastTimeRef.current = null; // Reset timing for smooth restarts.
  }, [deck]);

  // Run the animation loop and keep it in sync with layout changes.
  useEffect(() => {
    if (deck.length === 0) {
      return undefined; // Skip animation when there are no cards.
    }

    if (typeof window === "undefined") {
      return undefined; // Skip animation on the server.
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches) {
      return undefined; // Respect reduced motion preferences.
    }

    syncMetrics(); // Measure the track before starting.

    const handleResize = () => {
      syncMetrics(); // Recompute metrics after layout changes.
    };

    window.addEventListener("resize", handleResize); // Keep sizes current.
    animationRef.current = window.requestAnimationFrame((nextTime) =>
      animateRef.current(nextTime),
    ); // Schedule next frame via ref to satisfy hook linting.

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current); // Stop the animation loop.
      }

      window.removeEventListener("resize", handleResize); // Clean up resize listener.
    };
  }, [animate, deck.length, syncMetrics]);

  if (deck.length === 0) {
    return null; // Skip empty columns when there are no cards.
  }

  return (
    <div
      className={styles.homeFeed__column}
      onMouseEnter={handleMouseEnter} // Pause when hovering the column.
      onMouseLeave={handleMouseLeave} // Resume when leaving the column.
    >
      <div ref={trackRef} className={styles.homeFeed__columnTrack}>
        {loopedDeck.map((product, index) => (
          <ProductCard
            key={`${product.id}-${index}`}
            product={product}
            onOpen={openHandlers[index]} // Open modal/full page on click.
            renderSaveButton={saveButtonRenderers[index]} // Reuse memoized save button renderers.
          />
        ))}
      </div>
    </div>
  );
}
