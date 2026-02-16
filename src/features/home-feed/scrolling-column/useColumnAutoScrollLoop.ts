"use client";

import { useCallback, useEffect } from "react";
import type { MutableRefObject, RefObject } from "react";
import {
  clampFinitePosition,
  MANUAL_VELOCITY_DECAY,
  MIN_MANUAL_VELOCITY,
} from "@/features/home-feed/scrolling-column/scroll-utils";

/**
 * Auto-scroll animation loop + metric syncing for finite decks.
 */
export default function useColumnAutoScrollLoop({
  deckLength,
  duration,
  endDeckHeight,
  onReachEndZone,
  onForwardLoop,
  columnRef,
  trackRef,
  loopHeightRef,
  baseSpeedRef,
  targetSpeedRef,
  speedRef,
  positionRef,
  manualVelocityRef,
  isPausedRef,
  isDraggingRef,
  animationRef,
  lastTimeRef,
  durationRef,
  animateRef,
}: {
  deckLength: number;
  duration: number;
  endDeckHeight: number;
  onReachEndZone?: () => void;
  onForwardLoop?: () => void;
  columnRef: RefObject<HTMLDivElement | null>;
  trackRef: RefObject<HTMLDivElement | null>;
  loopHeightRef: MutableRefObject<number>;
  baseSpeedRef: MutableRefObject<number>;
  targetSpeedRef: MutableRefObject<number>;
  speedRef: MutableRefObject<number>;
  positionRef: MutableRefObject<number>;
  manualVelocityRef: MutableRefObject<number>;
  isPausedRef: MutableRefObject<boolean>;
  isDraggingRef: MutableRefObject<boolean>;
  animationRef: MutableRefObject<number | null>;
  lastTimeRef: MutableRefObject<number | null>;
  durationRef: MutableRefObject<number>;
  animateRef: MutableRefObject<(time: number) => void>;
}) {
  /**
   * Measure the track height and recompute the scroll speed.
   */
  const syncMetrics = useCallback(() => {
    const column = columnRef.current;
    const track = trackRef.current;

    if (!column || !track) {
      return; // Skip when the track is not mounted yet.
    }

    const totalHeight = track.getBoundingClientRect().height; // Full height of the visible deck.
    const columnHeight = column.getBoundingClientRect().height;
    const parentHeight = column.parentElement?.getBoundingClientRect().height ?? 0;
    const viewportHeight =
      parentHeight > 0 && columnHeight >= totalHeight - 1
        ? parentHeight // When the column auto-sizes to content, use the feed viewport height instead.
        : columnHeight; // Otherwise use the measured column viewport height directly.
    const revealThreshold = Math.max(totalHeight - viewportHeight, 0); // Start showing the bar when the last card reaches the bar's bottom edge.
    const visibleCardsHeight = Math.max(viewportHeight - endDeckHeight, 0); // Reserve the bar space while columns continue scrolling.
    const maxScroll = Math.max(totalHeight - visibleCardsHeight, 0); // Stop when the last card reaches the bar's top edge.

    if (totalHeight <= 0) {
      return; // Skip when layout has no measurable card height.
    }

    const previousMaxScroll = loopHeightRef.current; // Read previous range before updating.
    const wasPaused = isPausedRef.current; // Preserve paused state.

    if (previousMaxScroll > 0 && previousMaxScroll !== maxScroll) {
      const normalizedPosition = positionRef.current / previousMaxScroll; // Preserve visual progress across size changes.
      positionRef.current = clampFinitePosition(
        normalizedPosition * maxScroll,
        maxScroll,
      ); // Re-scale position for the new measured track height.
      track.style.transform = `translateY(-${positionRef.current}px)`; // Apply updated position immediately.
    } else {
      positionRef.current = clampFinitePosition(positionRef.current, maxScroll); // Clamp stale position after resize/deck changes.
      track.style.transform = `translateY(-${positionRef.current}px)`; // Keep transform coherent with clamped position.
    }

    loopHeightRef.current = maxScroll; // Cache finite max scroll distance.
    baseSpeedRef.current =
      maxScroll > 0 ? totalHeight / durationRef.current : 0; // Keep speed based on deck height, but stop when no room to scroll.
    targetSpeedRef.current = wasPaused || maxScroll <= 0 ? 0 : baseSpeedRef.current; // Keep pause state intact and stop when cards already fill the viewport.

    if (wasPaused || maxScroll <= 0) {
      speedRef.current = 0; // Ensure the track stays stopped when paused.
    }

    if (maxScroll <= 0) {
      onReachEndZone?.(); // Immediately reveal the bar when this deck has no scroll room.
      onForwardLoop?.(); // Treat non-scrollable decks as completed so the finite feed can still close.
      return;
    }

    if (positionRef.current >= revealThreshold) {
      onReachEndZone?.(); // Keep reveal state in sync after resizes/manual position updates.
    }
  }, [
    columnRef,
    endDeckHeight,
    baseSpeedRef,
    durationRef,
    isPausedRef,
    loopHeightRef,
    positionRef,
    speedRef,
    targetSpeedRef,
    trackRef,
    onReachEndZone,
    onForwardLoop,
  ]);

  /**
   * Animate the column by translating the track on each frame.
   */
  const animate = useCallback(
    (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time; // Seed the previous time for delta math.
      }

      const deltaSeconds = (time - lastTimeRef.current) / 1000; // Convert to seconds.
      lastTimeRef.current = time; // Store the current frame time.

      const maxScroll = loopHeightRef.current; // Finite max scroll distance for this column.
      const track = trackRef.current; // DOM node to move.

      const manualDecay = Math.exp(-MANUAL_VELOCITY_DECAY * deltaSeconds);
      manualVelocityRef.current *= manualDecay; // Ease manual input out smoothly.
      if (Math.abs(manualVelocityRef.current) < MIN_MANUAL_VELOCITY) {
        manualVelocityRef.current = 0; // Snap tiny values to 0 to avoid jitter.
      }

      if (track && maxScroll > 0 && !isDraggingRef.current) {
        const revealThreshold = Math.max(maxScroll - endDeckHeight, 0); // Position where the bar should begin showing.
        const baseTarget = targetSpeedRef.current; // Base speed respects pause state.
        const combinedTarget = baseTarget + manualVelocityRef.current; // Add manual velocity assist.
        const speedDelta = (combinedTarget - speedRef.current) * 0.08; // Ease toward combined target.
        let nextSpeed = speedRef.current + speedDelta; // Apply speed easing.
        const previousPosition = positionRef.current; // Compare positions to detect forward loop completion.
        const requestedPosition = previousPosition + nextSpeed * deltaSeconds; // Proposed next position before clamping.
        const nextPosition = clampFinitePosition(
          requestedPosition,
          maxScroll,
        ); // Clamp to finite track bounds so no cards repeat.
        const reachedEndZone =
          previousPosition < revealThreshold && nextPosition >= revealThreshold;
        const reachedEnd = previousPosition < maxScroll && nextPosition >= maxScroll;
        const hitBoundary =
          (nextPosition >= maxScroll && nextSpeed > 0) ||
          (nextPosition <= 0 && nextSpeed < 0);

        if (hitBoundary) {
          nextSpeed = 0; // Stop inertial drift once we hit the finite bounds.
          manualVelocityRef.current = 0; // Prevent boundary jitter from residual velocity.
        }

        speedRef.current = nextSpeed; // Update the current speed.
        positionRef.current = nextPosition; // Cache the current position.
        track.style.transform = `translateY(-${nextPosition}px)`; // Move the track.

        if (reachedEndZone) {
          onReachEndZone?.(); // Reveal end-of-feed bar when the first column enters the bottom zone.
        }

        if (reachedEnd) {
          onForwardLoop?.(); // Notify finite-feed state when this column consumes its full deck.
        }
      }

      animationRef.current = window.requestAnimationFrame((nextTime) =>
        animateRef.current(nextTime),
      ); // Schedule next frame via ref to avoid direct self-reference.
    },
    [
      animateRef,
      animationRef,
      isDraggingRef,
      lastTimeRef,
      loopHeightRef,
      manualVelocityRef,
      positionRef,
      speedRef,
      targetSpeedRef,
      trackRef,
      endDeckHeight,
      onReachEndZone,
      onForwardLoop,
    ],
  );

  useEffect(() => {
    animateRef.current = animate; // Keep requestAnimationFrame recursion synced.
  }, [animate, animateRef]);

  useEffect(() => {
    durationRef.current = duration; // Track the latest duration value.
    syncMetrics(); // Recompute speeds without resetting position.
  }, [duration, durationRef, syncMetrics]);

  useEffect(() => {
    if (deckLength === 0) {
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
      resizeObserver.observe(trackRef.current); // Track content height changes.
    }

    animationRef.current = window.requestAnimationFrame((nextTime) =>
      animateRef.current(nextTime),
    ); // Start animation loop.

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current); // Stop the animation loop.
      }

      resizeObserver?.disconnect(); // Clean up content resize observer.
      window.removeEventListener("resize", handleResize); // Clean up resize listener.
    };
  }, [animateRef, animationRef, deckLength, syncMetrics, trackRef]);
}
