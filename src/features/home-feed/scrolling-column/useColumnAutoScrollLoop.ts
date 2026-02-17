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
  onApproachEnd,
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
  onApproachEnd?: () => void;
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
   * Measure the track height and recompute movement limits + speed.
   */
  const syncMetrics = useCallback(() => {
    const column = columnRef.current;
    const track = trackRef.current;
    if (!column || !track) {
      return;
    }

    const totalHeight = track.getBoundingClientRect().height;
    const columnHeight = column.getBoundingClientRect().height;
    const parentHeight = column.parentElement?.getBoundingClientRect().height ?? 0;
    const viewportHeight =
      parentHeight > 0 && columnHeight >= totalHeight - 1
        ? parentHeight
        : columnHeight;
    const revealThreshold = Math.max(totalHeight - viewportHeight, 0);
    const visibleCardsHeight = Math.max(viewportHeight - endDeckHeight, 0);
    const maxScroll = Math.max(totalHeight - visibleCardsHeight, 0);

    if (totalHeight <= 0) {
      return;
    }

    const wasPaused = isPausedRef.current;
    positionRef.current = clampFinitePosition(positionRef.current, maxScroll);
    track.style.transform = `translateY(-${positionRef.current}px)`;

    loopHeightRef.current = maxScroll;
    baseSpeedRef.current = maxScroll > 0 ? totalHeight / durationRef.current : 0;
    targetSpeedRef.current = wasPaused || maxScroll <= 0 ? 0 : baseSpeedRef.current;
    if (wasPaused || maxScroll <= 0) {
      speedRef.current = 0;
    }

    if (maxScroll <= 0) {
      onReachEndZone?.();
      onForwardLoop?.();
      return;
    }

    if (positionRef.current >= revealThreshold) {
      onReachEndZone?.();
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
        lastTimeRef.current = time;
      }

      const deltaSeconds = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const maxScroll = loopHeightRef.current;
      const track = trackRef.current;

      const manualDecay = Math.exp(-MANUAL_VELOCITY_DECAY * deltaSeconds);
      manualVelocityRef.current *= manualDecay;
      if (Math.abs(manualVelocityRef.current) < MIN_MANUAL_VELOCITY) {
        manualVelocityRef.current = 0;
      }

      if (track && maxScroll > 0 && !isDraggingRef.current) {
        const revealThreshold = Math.max(maxScroll - endDeckHeight, 0);
        const lastCardHeight =
          track.lastElementChild instanceof HTMLElement
            ? track.lastElementChild.offsetHeight
            : 0;
        const preloadPx = Math.max(24, lastCardHeight * 0.35);
        const baseTarget = targetSpeedRef.current;
        const combinedTarget = baseTarget + manualVelocityRef.current;
        const speedDelta = (combinedTarget - speedRef.current) * 0.08;
        let nextSpeed = speedRef.current + speedDelta;
        const previousPosition = positionRef.current;
        const requestedPosition = previousPosition + nextSpeed * deltaSeconds;
        const nextPosition = clampFinitePosition(requestedPosition, maxScroll);
        const reachedEndZone =
          previousPosition < revealThreshold && nextPosition >= revealThreshold;
        const previousGapPx = Math.max(maxScroll - previousPosition, 0);
        const nextGapPx = Math.max(maxScroll - nextPosition, 0);
        const reachedTopUpThreshold =
          previousGapPx > preloadPx && nextGapPx <= preloadPx;
        const reachedEnd = previousPosition < maxScroll && nextPosition >= maxScroll;
        const hitBoundary =
          (nextPosition >= maxScroll && nextSpeed > 0) ||
          (nextPosition <= 0 && nextSpeed < 0);

        if (hitBoundary) {
          nextSpeed = 0;
          manualVelocityRef.current = 0;
        }

        speedRef.current = nextSpeed;
        positionRef.current = nextPosition;
        track.style.transform = `translateY(-${nextPosition}px)`;

        if (reachedEndZone) {
          onReachEndZone?.();
        }
        if (reachedTopUpThreshold) {
          onApproachEnd?.();
        }
        if (reachedEnd) {
          onForwardLoop?.();
        }
      }

      animationRef.current = window.requestAnimationFrame((nextTime) =>
        animateRef.current(nextTime),
      );
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
      onApproachEnd,
      onReachEndZone,
      onForwardLoop,
    ],
  );

  useEffect(() => {
    animateRef.current = animate;
  }, [animate, animateRef]);

  useEffect(() => {
    durationRef.current = duration;
    syncMetrics();
  }, [duration, durationRef, syncMetrics]);

  useEffect(() => {
    if (deckLength === 0 || typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return undefined;
    }

    syncMetrics();
    const handleResize = () => {
      syncMetrics();
    };
    const resizeObserver =
      "ResizeObserver" in window ? new ResizeObserver(syncMetrics) : null;

    window.addEventListener("resize", handleResize);
    if (trackRef.current && resizeObserver) {
      resizeObserver.observe(trackRef.current);
    }

    animationRef.current = window.requestAnimationFrame((nextTime) =>
      animateRef.current(nextTime),
    );

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [animateRef, animationRef, deckLength, syncMetrics, trackRef]);
}

