"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
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

const DRAG_START_THRESHOLD_PX = 6; // Minimum movement before we treat touch input as a drag gesture.
const WHEEL_LINE_HEIGHT_PX = 18; // Approximate pixel height for wheel deltaMode line scrolling.
const WHEEL_VELOCITY_SCALE = 1.6; // Convert wheel pixels into a temporary velocity impulse.
const TOUCH_VELOCITY_SCALE = 0.85; // Convert touch drag velocity into a temporary velocity impulse.
const MANUAL_VELOCITY_DECAY = 1.15; // Exponential decay (per second) back toward the baseline auto-scroll.
const MIN_MANUAL_VELOCITY = 6; // Smallest velocity magnitude worth keeping before snapping to 0.
const MAX_MANUAL_SPEED_MULTIPLIER = 7; // Clamp manual speed to a multiple of the baseline auto-scroll.

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
 * Normalize a scroll position into a 0..loopHeight range (handles negative modulo).
 */
const normalizeLoopPosition = (position: number, loopHeight: number) => {
  const modulo = position % loopHeight; // Wrap position using modulo arithmetic.
  return modulo < 0 ? modulo + loopHeight : modulo; // Convert negative modulo results into a positive range.
};

/**
 * Convert a wheel event delta into pixels.
 */
const toWheelPixels = (event: WheelEvent, pageHeightPx: number) => {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * WHEEL_LINE_HEIGHT_PX; // Normalize line-based wheel deltas.
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * pageHeightPx; // Approximate a page as the supplied height.
  }

  return event.deltaY; // Pixels already.
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
  const columnRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const loopHeightRef = useRef(0);
  const baseSpeedRef = useRef(0);
  const speedRef = useRef(0);
  const targetSpeedRef = useRef(0);
  const manualVelocityRef = useRef(0);
  const isPausedRef = useRef(false);
  const isHoveringRef = useRef(false);
  const isModalOpenRef = useRef(false);
  const isWishlistMenuOpenRef = useRef(false);
  const isInteractingRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartYRef = useRef(0);
  const dragStartPositionRef = useRef(0);
  const lastDragYRef = useRef(0);
  const lastDragTimeRef = useRef(0);
  const dragVelocityRef = useRef(0);
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
      isWishlistMenuOpenRef.current ||
      isInteractingRef.current;

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

    // Decay manual velocity back toward 0 so the auto-scroll becomes the baseline again.
    const manualDecay = Math.exp(-MANUAL_VELOCITY_DECAY * deltaSeconds);
    manualVelocityRef.current *= manualDecay; // Ease manual input out smoothly.
    if (Math.abs(manualVelocityRef.current) < MIN_MANUAL_VELOCITY) {
      manualVelocityRef.current = 0; // Snap tiny values to 0 to avoid jitter.
    }

    if (track && loopHeight > 0) {
      if (!isDraggingRef.current) {
        const baseTarget = targetSpeedRef.current; // Base speed is paused/resumed via syncPauseState.
        const combinedTarget = baseTarget + manualVelocityRef.current; // Add manual velocity for wheel/drag assist.
        const speedDelta = (combinedTarget - speedRef.current) * 0.08; // Ease toward the combined target speed.
        const nextSpeed = speedRef.current + speedDelta; // Apply speed easing.
        const nextPosition = normalizeLoopPosition(
          positionRef.current + nextSpeed * deltaSeconds,
          loopHeight,
        ); // Wrap position safely (supports negative speed).

        speedRef.current = nextSpeed; // Update the current speed.
        positionRef.current = nextPosition; // Cache the current position.
        track.style.transform = `translateY(-${nextPosition}px)`; // Move the track.
      }
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

  /**
   * Enable wheel-based speed nudging (desktop/trackpad manual scroll assist).
   */
  useEffect(() => {
    const column = columnRef.current;

    if (!column) {
      return undefined; // Skip when the column is not mounted yet.
    }

    const handleWheel = (event: WheelEvent) => {
      if (isModalOpenRef.current || isWishlistMenuOpenRef.current) {
        return; // Keep the feed fully paused while modals/menus are open.
      }

      const track = trackRef.current;
      const loopHeight = loopHeightRef.current;

      if (!track || loopHeight <= 0) {
        return; // Skip until we have measurable layout.
      }

      event.preventDefault(); // Keep wheel input focused on the feed instead of the page.

      const deltaPixels = toWheelPixels(event, loopHeight); // Convert the delta into pixel units.

      const nextPosition = normalizeLoopPosition(
        positionRef.current + deltaPixels,
        loopHeight,
      ); // Move the track immediately for responsiveness.
      positionRef.current = nextPosition; // Persist the updated position.
      track.style.transform = `translateY(-${nextPosition}px)`; // Apply the transform now.

      const baseSpeed = baseSpeedRef.current; // Baseline scroll speed for clamping.
      const maxManualSpeed = Math.max(120, baseSpeed * MAX_MANUAL_SPEED_MULTIPLIER);
      const nextManualVelocity = manualVelocityRef.current + deltaPixels * WHEEL_VELOCITY_SCALE;
      manualVelocityRef.current = Math.min(
        maxManualSpeed,
        Math.max(-maxManualSpeed, nextManualVelocity),
      ); // Add a temporary velocity impulse that decays back to 0.
    };

    column.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      column.removeEventListener("wheel", handleWheel);
    };
  }, []);

  /**
   * Begin tracking a touch pointer for drag-to-scroll assist.
   */
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") {
      return; // Only enable drag-to-scroll assist for touch pointers.
    }

    if (isModalOpenRef.current || isWishlistMenuOpenRef.current) {
      return; // Ignore touches while modals/menus are open.
    }

    isPointerDownRef.current = true; // Track a possible drag start.
    pointerIdRef.current = event.pointerId; // Capture the pointer id for move/up filtering.
    dragStartYRef.current = event.clientY; // Seed drag measurements.
    dragStartPositionRef.current = positionRef.current; // Preserve starting position.
    lastDragYRef.current = event.clientY; // Seed velocity measurement.
    lastDragTimeRef.current = event.timeStamp; // Seed velocity measurement.
    dragVelocityRef.current = 0; // Reset velocity history per gesture.

    columnRef.current?.setPointerCapture(event.pointerId); // Keep receiving move/up events.
  };

  /**
   * Track touch drag movement and update the column position.
   */
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) {
      return; // Ignore when there is no active pointer down.
    }

    if (event.pointerId !== pointerIdRef.current) {
      return; // Ignore moves from other pointers.
    }

    if (event.pointerType !== "touch") {
      return; // Ignore non-touch pointer moves.
    }

    const loopHeight = loopHeightRef.current;
    const track = trackRef.current;

    if (!track || loopHeight <= 0) {
      return; // Skip until layout is measured.
    }

    const deltaY = event.clientY - dragStartYRef.current; // Positive when finger moves down.

    if (!isDraggingRef.current && Math.abs(deltaY) < DRAG_START_THRESHOLD_PX) {
      return; // Wait for a small movement threshold to avoid breaking taps.
    }

    if (!isDraggingRef.current) {
      isDraggingRef.current = true; // Flip into dragging mode once threshold is passed.
      isInteractingRef.current = true; // Pause auto-scroll while dragging.
      manualVelocityRef.current = 0; // Clear manual velocity so dragging is deterministic.
      speedRef.current = 0; // Stop track momentum while touch is controlling position.
      syncPauseState(); // Recompute pause behavior with interaction enabled.
    }

    event.preventDefault(); // Keep drag gestures focused on the feed.

    const nextPosition = normalizeLoopPosition(
      dragStartPositionRef.current - deltaY,
      loopHeight,
    ); // Follow finger movement (drag down = scroll up).
    positionRef.current = nextPosition; // Persist the updated position.
    track.style.transform = `translateY(-${nextPosition}px)`; // Apply transform immediately.

    const deltaSinceLast = event.clientY - lastDragYRef.current; // Positive when moving down.
    const timeSinceLast = (event.timeStamp - lastDragTimeRef.current) / 1000; // Convert to seconds.
    if (timeSinceLast > 0) {
      dragVelocityRef.current = -(deltaSinceLast / timeSinceLast); // Convert finger delta into scroll velocity.
    }

    lastDragYRef.current = event.clientY; // Update velocity sample cursor.
    lastDragTimeRef.current = event.timeStamp; // Update velocity sample cursor.
  };

  /**
   * Finish a drag gesture and let the column ease back to baseline scrolling.
   */
  const endPointerGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) {
      return; // Skip when no gesture is active.
    }

    if (event.pointerId !== pointerIdRef.current) {
      return; // Ignore unrelated pointer ids.
    }

    if (event.pointerType !== "touch") {
      return; // Only handle touch gestures.
    }

    columnRef.current?.releasePointerCapture(event.pointerId); // Release capture now that the gesture ended.

    isPointerDownRef.current = false; // Clear pointer-down tracking.
    pointerIdRef.current = null; // Clear captured pointer id.

    if (isDraggingRef.current) {
      const baseSpeed = baseSpeedRef.current; // Baseline speed for clamping.
      const maxManualSpeed = Math.max(120, baseSpeed * MAX_MANUAL_SPEED_MULTIPLIER);
      const nextManualVelocity = dragVelocityRef.current * TOUCH_VELOCITY_SCALE;
      manualVelocityRef.current = Math.min(
        maxManualSpeed,
        Math.max(-maxManualSpeed, nextManualVelocity),
      ); // Apply a small inertial impulse after releasing the drag.

      isDraggingRef.current = false; // Exit dragging mode.
      isInteractingRef.current = false; // Allow auto-scroll to resume.
      syncPauseState(); // Recompute pause behavior after interaction ends.

      speedRef.current = targetSpeedRef.current + manualVelocityRef.current; // Seed speed to avoid a post-drag stall.
    }
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
    manualVelocityRef.current = 0; // Clear manual velocity impulses between decks.
    isInteractingRef.current = false; // Clear interaction pause state on deck swaps.
    isPointerDownRef.current = false; // Reset gesture tracking for safety.
    isDraggingRef.current = false; // Reset gesture tracking for safety.
    pointerIdRef.current = null; // Reset gesture tracking for safety.
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
      ref={columnRef}
      className={styles.homeFeed__column}
      onMouseEnter={handleMouseEnter} // Pause when hovering the column.
      onMouseLeave={handleMouseLeave} // Resume when leaving the column.
      onPointerDown={handlePointerDown} // Start touch drag gesture tracking.
      onPointerMove={handlePointerMove} // Update position during touch drags.
      onPointerUp={endPointerGesture} // End touch gesture on release.
      onPointerCancel={endPointerGesture} // End touch gesture on cancellation.
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
