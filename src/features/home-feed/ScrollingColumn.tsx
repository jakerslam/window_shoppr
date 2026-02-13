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
        enableListMenu={false} // Keep feed interactions simple: click-to-save only.
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
  const isWishlistMenuOpenRef = useRef(false);
  const durationRef = useRef(duration);
  const animateRef = useRef<(time: number) => void>(() => undefined);

  const loopedDeck = useMemo(() => [...deck, ...deck], [deck]);
  const deckSignature = useMemo(
    () => deck.map((product) => product.id).join("|"),
    [deck],
  ); // Track meaningful deck changes, not array identity churn.

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
   * Sync animation pause state from hover, modal, and wishlist menu visibility.
   */
  const syncPauseState = useCallback(() => {
    const shouldPause =
      isHoveringRef.current ||
      isModalOpenRef.current ||
      isWishlistMenuOpenRef.current;

    isPausedRef.current = shouldPause; // Keep state coherent for resize/metric sync.
    targetSpeedRef.current = shouldPause ? 0 : baseSpeedRef.current; // Stop or resume toward base speed.
  }, []);

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

    const previousLoopHeight = loopHeightRef.current; // Read previous loop height before updating.
    const wasPaused = isPausedRef.current; // Preserve hover pause state.

    if (previousLoopHeight > 0 && previousLoopHeight !== loopHeight) {
      const normalizedPosition =
        (positionRef.current % previousLoopHeight) / previousLoopHeight; // Preserve visual progress across height changes.
      positionRef.current = normalizedPosition * loopHeight; // Re-scale position for the new loop height.
      track.style.transform = `translateY(-${positionRef.current}px)`; // Apply updated position immediately to prevent a jolt.
    }

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

  // Pause the scroll whenever a modal is open.
  useEffect(() => {
    isModalOpenRef.current = isModalOpen; // Keep modal state in sync.
    syncPauseState(); // Recompute pause behavior against hover/menu state.
  }, [isModalOpen, syncPauseState]);

  // Pause the scroll while any wishlist list menu is open.
  useEffect(() => {
    const handleWishlistMenuToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      isWishlistMenuOpenRef.current = Boolean(customEvent.detail?.open); // Track global wishlist menu state.
      syncPauseState(); // Pause/resume based on global menu visibility.
    };

    window.addEventListener("wishlist-menu:toggle", handleWishlistMenuToggle);

    return () => {
      window.removeEventListener("wishlist-menu:toggle", handleWishlistMenuToggle);
    };
  }, [syncPauseState]);

  // Update scroll speed whenever the duration changes.
  useEffect(() => {
    durationRef.current = duration; // Track the latest duration value.
    syncMetrics(); // Recompute speeds without resetting position.
  }, [duration, syncMetrics]);

  // Reset position only when card membership/order changes.
  useEffect(() => {
    positionRef.current = 0; // Start new decks at the top.
    speedRef.current = 0; // Avoid carrying momentum between different decks.
    lastTimeRef.current = null; // Reset timing for smooth restarts.
    targetSpeedRef.current = isPausedRef.current ? 0 : baseSpeedRef.current; // Respect paused state on reset.

    if (trackRef.current) {
      trackRef.current.style.transform = "translateY(0px)"; // Keep transform in sync with reset position.
    }
  }, [deckSignature]);

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
    const resizeObserver =
      "ResizeObserver" in window ? new ResizeObserver(syncMetrics) : null;

    window.addEventListener("resize", handleResize); // Keep sizes current.
    if (trackRef.current && resizeObserver) {
      resizeObserver.observe(trackRef.current); // Track content height changes (image load/layout shifts).
    }
    animationRef.current = window.requestAnimationFrame((nextTime) =>
      animateRef.current(nextTime),
    ); // Schedule next frame via ref to satisfy hook linting.

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current); // Stop the animation loop.
      }

      resizeObserver?.disconnect(); // Clean up content resize observer.
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
