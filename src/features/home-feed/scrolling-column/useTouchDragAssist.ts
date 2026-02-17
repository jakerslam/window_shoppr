"use client";

import { useCallback, useRef } from "react";
import type {
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import {
  clampFinitePosition,
  DRAG_START_THRESHOLD_PX,
  MAX_MANUAL_SPEED_MULTIPLIER,
  TOUCH_VELOCITY_SCALE,
} from "@/features/home-feed/scrolling-column/scroll-utils";

/**
 * Touch drag-to-scroll assist (mobile): drag a column and release with inertial impulse.
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
   * Reset in-progress gesture state when decks swap under the column.
   */
  const resetTouchState = useCallback(() => {
    isPointerDownRef.current = false;
    pointerIdRef.current = null;
    dragVelocityRef.current = 0;
    isDraggingRef.current = false;
    isInteractingRef.current = false;
  }, [isDraggingRef, isInteractingRef]);

  /**
   * Start tracking a touch pointer for drag-to-scroll.
   */
  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "touch" || isModalOpenRef.current) {
        return;
      }

      isPointerDownRef.current = true;
      pointerIdRef.current = event.pointerId;
      dragStartYRef.current = event.clientY;
      dragStartPositionRef.current = positionRef.current;
      lastDragYRef.current = event.clientY;
      lastDragTimeRef.current = event.timeStamp;
      dragVelocityRef.current = 0;

      columnRef.current?.setPointerCapture(event.pointerId);
    },
    [columnRef, isModalOpenRef, positionRef],
  );

  /**
   * Track touch drag movement and update column position.
   */
  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isPointerDownRef.current || event.pointerId !== pointerIdRef.current) {
        return;
      }
      if (event.pointerType !== "touch") {
        return;
      }

      const maxPosition = loopHeightRef.current;
      const track = trackRef.current;
      if (!track || maxPosition <= 0) {
        return;
      }

      const deltaY = event.clientY - dragStartYRef.current;
      if (!isDraggingRef.current && Math.abs(deltaY) < DRAG_START_THRESHOLD_PX) {
        return;
      }

      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        isInteractingRef.current = true;
        manualVelocityRef.current = 0;
        speedRef.current = 0;
        syncPauseState();
      }

      event.preventDefault();

      const nextPosition = clampFinitePosition(
        dragStartPositionRef.current - deltaY,
        maxPosition,
      );
      positionRef.current = nextPosition;
      track.style.transform = `translateY(-${nextPosition}px)`;

      const deltaSinceLast = event.clientY - lastDragYRef.current;
      const timeSinceLast = (event.timeStamp - lastDragTimeRef.current) / 1000;
      if (timeSinceLast > 0) {
        dragVelocityRef.current = -(deltaSinceLast / timeSinceLast);
      }

      lastDragYRef.current = event.clientY;
      lastDragTimeRef.current = event.timeStamp;
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
   * End drag gesture and apply inertial velocity.
   */
  const endPointerGesture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isPointerDownRef.current || event.pointerId !== pointerIdRef.current) {
        return;
      }
      if (event.pointerType !== "touch") {
        return;
      }

      columnRef.current?.releasePointerCapture(event.pointerId);
      isPointerDownRef.current = false;
      pointerIdRef.current = null;

      if (!isDraggingRef.current) {
        return;
      }

      const baseSpeed = baseSpeedRef.current;
      const maxManualSpeed = Math.max(120, baseSpeed * MAX_MANUAL_SPEED_MULTIPLIER);
      const nextManualVelocity = dragVelocityRef.current * TOUCH_VELOCITY_SCALE;
      manualVelocityRef.current = Math.min(
        maxManualSpeed,
        Math.max(-maxManualSpeed, nextManualVelocity),
      );

      isDraggingRef.current = false;
      triggerInteractionCooldown();
      speedRef.current = targetSpeedRef.current + manualVelocityRef.current;
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

