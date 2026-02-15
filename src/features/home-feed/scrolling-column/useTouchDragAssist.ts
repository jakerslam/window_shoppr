"use client";

import { useCallback, useRef } from "react";
import type {
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import {
  DRAG_START_THRESHOLD_PX,
  MAX_MANUAL_SPEED_MULTIPLIER,
  TOUCH_VELOCITY_SCALE,
  normalizeLoopPosition,
} from "@/features/home-feed/scrolling-column/scroll-utils";

/**
 * Touch drag-to-scroll assist (mobile): users can drag a column and release with a small inertial impulse.
 */
export default function useTouchDragAssist({
  columnRef,
  trackRef,
  loopHeightRef,
  baseSpeedRef,
  positionRef,
  speedRef,
  targetSpeedRef,
  manualVelocityRef,
  isDraggingRef,
  isInteractingRef,
  isModalOpenRef,
  isWishlistMenuOpenRef,
  syncPauseState,
  triggerInteractionCooldown,
}: {
  columnRef: RefObject<HTMLDivElement | null>;
  trackRef: RefObject<HTMLDivElement | null>;
  loopHeightRef: MutableRefObject<number>;
  baseSpeedRef: MutableRefObject<number>;
  positionRef: MutableRefObject<number>;
  speedRef: MutableRefObject<number>;
  targetSpeedRef: MutableRefObject<number>;
  manualVelocityRef: MutableRefObject<number>;
  isDraggingRef: MutableRefObject<boolean>;
  isInteractingRef: MutableRefObject<boolean>;
  isModalOpenRef: MutableRefObject<boolean>;
  isWishlistMenuOpenRef: MutableRefObject<boolean>;
  syncPauseState: () => void;
  triggerInteractionCooldown: () => void;
}) {
  const isPointerDownRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartYRef = useRef(0);
  const dragStartPositionRef = useRef(0);
  const lastDragYRef = useRef(0);
  const lastDragTimeRef = useRef(0);
  const dragVelocityRef = useRef(0);

  /**
   * Reset any in-progress gesture state (used when decks swap underneath the column).
   */
  const resetTouchState = useCallback(() => {
    isPointerDownRef.current = false; // Clear pointer-down tracking.
    pointerIdRef.current = null; // Clear captured pointer id.
    dragVelocityRef.current = 0; // Clear velocity history.
    isDraggingRef.current = false; // Ensure dragging mode is cleared.
    isInteractingRef.current = false; // Ensure interaction pause is cleared.
  }, [isDraggingRef, isInteractingRef]);

  /**
   * Begin tracking a touch pointer for drag-to-scroll assist.
   */
  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
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
    },
    [columnRef, isModalOpenRef, isWishlistMenuOpenRef, positionRef],
  );

  /**
   * Track touch drag movement and update the column position.
   */
  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
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
    },
    [
      isDraggingRef,
      isInteractingRef,
      loopHeightRef,
      manualVelocityRef,
      positionRef,
      speedRef,
      syncPauseState,
      trackRef,
    ],
  );

  /**
   * Finish a drag gesture and let the column ease back to baseline scrolling.
   */
  const endPointerGesture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
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

      if (!isDraggingRef.current) {
        return; // Keep taps behaving normally.
      }

      const baseSpeed = baseSpeedRef.current; // Baseline speed for clamping.
      const maxManualSpeed = Math.max(120, baseSpeed * MAX_MANUAL_SPEED_MULTIPLIER);
      const nextManualVelocity = dragVelocityRef.current * TOUCH_VELOCITY_SCALE;
      manualVelocityRef.current = Math.min(
        maxManualSpeed,
        Math.max(-maxManualSpeed, nextManualVelocity),
      ); // Apply a small inertial impulse after releasing the drag.

      isDraggingRef.current = false; // Exit dragging mode.
      triggerInteractionCooldown(); // Hold auto-scroll briefly before resuming.

      speedRef.current = targetSpeedRef.current + manualVelocityRef.current; // Seed speed to avoid a post-drag stall.
    },
    [
      baseSpeedRef,
      columnRef,
      isDraggingRef,
      manualVelocityRef,
      speedRef,
      targetSpeedRef,
      triggerInteractionCooldown,
    ],
  );

  return {
    handlePointerDown,
    handlePointerMove,
    endPointerGesture,
    resetTouchState,
  };
}
