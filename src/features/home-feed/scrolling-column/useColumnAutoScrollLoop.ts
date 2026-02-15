"use client";

import { useCallback, useEffect } from "react";
import type { MutableRefObject, RefObject } from "react";
import {
  MANUAL_VELOCITY_DECAY,
  MIN_MANUAL_VELOCITY,
  normalizeLoopPosition,
} from "@/features/home-feed/scrolling-column/scroll-utils";

/**
 * Auto-scroll animation loop + metric syncing (track height -> speed).
 */
export default function useColumnAutoScrollLoop({
  deckLength,
  duration,
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
    const wasPaused = isPausedRef.current; // Preserve paused state.

    if (previousLoopHeight > 0 && previousLoopHeight !== loopHeight) {
      const normalizedPosition =
        (positionRef.current % previousLoopHeight) / previousLoopHeight; // Preserve visual progress across height changes.
      positionRef.current = normalizedPosition * loopHeight; // Re-scale position for the new loop height.
      track.style.transform = `translateY(-${positionRef.current}px)`; // Apply updated position immediately.
    }

    loopHeightRef.current = loopHeight; // Cache the loop height for animation.
    baseSpeedRef.current = loopHeight / durationRef.current; // Compute pixels per second.
    targetSpeedRef.current = wasPaused ? 0 : baseSpeedRef.current; // Keep pause state intact.

    if (wasPaused) {
      speedRef.current = 0; // Ensure the track stays stopped when paused.
    }
  }, [
    baseSpeedRef,
    durationRef,
    isPausedRef,
    loopHeightRef,
    positionRef,
    speedRef,
    targetSpeedRef,
    trackRef,
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

      const loopHeight = loopHeightRef.current; // Height of a full deck loop.
      const track = trackRef.current; // DOM node to move.

      const manualDecay = Math.exp(-MANUAL_VELOCITY_DECAY * deltaSeconds);
      manualVelocityRef.current *= manualDecay; // Ease manual input out smoothly.
      if (Math.abs(manualVelocityRef.current) < MIN_MANUAL_VELOCITY) {
        manualVelocityRef.current = 0; // Snap tiny values to 0 to avoid jitter.
      }

      if (track && loopHeight > 0 && !isDraggingRef.current) {
        const baseTarget = targetSpeedRef.current; // Base speed respects pause state.
        const combinedTarget = baseTarget + manualVelocityRef.current; // Add manual velocity assist.
        const speedDelta = (combinedTarget - speedRef.current) * 0.08; // Ease toward combined target.
        const nextSpeed = speedRef.current + speedDelta; // Apply speed easing.
        const nextPosition = normalizeLoopPosition(
          positionRef.current + nextSpeed * deltaSeconds,
          loopHeight,
        ); // Wrap position safely (supports negative speed).

        speedRef.current = nextSpeed; // Update the current speed.
        positionRef.current = nextPosition; // Cache the current position.
        track.style.transform = `translateY(-${nextPosition}px)`; // Move the track.
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

