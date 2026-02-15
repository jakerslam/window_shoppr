"use client";

import { useCallback, useEffect, useRef } from "react";
import useColumnAutoScrollLoop from "@/features/home-feed/scrolling-column/useColumnAutoScrollLoop";
import useColumnHoverPause from "@/features/home-feed/scrolling-column/useColumnHoverPause";
import useColumnPauseSignals from "@/features/home-feed/scrolling-column/useColumnPauseSignals";
import useTouchDragAssist from "@/features/home-feed/scrolling-column/useTouchDragAssist";
import useWheelAssist from "@/features/home-feed/scrolling-column/useWheelAssist";

/**
 * Motion controller for a single scrolling column (auto-scroll + hover pause + manual assist).
 */
export default function useColumnMotion({
  duration,
  deckSignature,
  deckLength,
  isModalOpen,
  isFeedEnded,
  onForwardLoop,
}: {
  duration: number;
  deckSignature: string;
  deckLength: number;
  isModalOpen: boolean;
  isFeedEnded: boolean;
  onForwardLoop?: () => void;
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
  const isFeedEndedRef = useRef(false);
  const isWishlistMenuOpenRef = useRef(false);
  const isInteractingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const durationRef = useRef(duration);
  const animateRef = useRef<(time: number) => void>(() => undefined);

  /**
   * Sync animation pause state from hover, modal, and wishlist menu visibility.
   */
  const syncPauseState = useCallback(() => {
    const shouldPause =
      isHoveringRef.current ||
      isModalOpenRef.current ||
      isFeedEndedRef.current ||
      isWishlistMenuOpenRef.current ||
      isInteractingRef.current;

    isPausedRef.current = shouldPause; // Keep state coherent for resize/metric sync.
    targetSpeedRef.current = shouldPause ? 0 : baseSpeedRef.current; // Stop or resume toward base speed.
  }, []);

  const { handleMouseEnter, handleMouseLeave } = useColumnHoverPause({
    isHoveringRef,
    syncPauseState,
  }); // Pause/resume based on true hover support.

  useColumnPauseSignals({
    isModalOpen,
    isModalOpenRef,
    isWishlistMenuOpenRef,
    syncPauseState,
  }); // Pause feed when overlays are active.

  useEffect(() => {
    isFeedEndedRef.current = isFeedEnded; // Sync finite-feed pause signal.
    syncPauseState(); // Re-evaluate pause state when deck-end state changes.
  }, [isFeedEnded, syncPauseState]);

  useWheelAssist({
    columnRef,
    trackRef,
    loopHeightRef,
    positionRef,
    baseSpeedRef,
    manualVelocityRef,
    isModalOpenRef,
    isWishlistMenuOpenRef,
  }); // Enable wheel-based speed nudging.

  const { handlePointerDown, handlePointerMove, endPointerGesture, resetTouchState } =
    useTouchDragAssist({
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
    }); // Enable touch drag-to-scroll assist.

  useColumnAutoScrollLoop({
    deckLength,
    duration,
    onForwardLoop,
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
  }); // Run the requestAnimationFrame loop and sync layout metrics.

  useEffect(() => {
    positionRef.current = 0; // Start new decks at the top.
    speedRef.current = 0; // Avoid carrying momentum between different decks.
    manualVelocityRef.current = 0; // Clear manual velocity impulses between decks.
    isInteractingRef.current = false; // Clear interaction pause state on deck swaps.
    isDraggingRef.current = false; // Reset gesture tracking for safety.
    lastTimeRef.current = null; // Reset timing for smooth restarts.
    resetTouchState(); // Reset internal touch gesture state.
    targetSpeedRef.current = isPausedRef.current ? 0 : baseSpeedRef.current; // Respect paused state on reset.

    if (trackRef.current) {
      trackRef.current.style.transform = "translateY(0px)"; // Keep transform in sync with reset position.
    }
  }, [deckSignature, resetTouchState]);

  return {
    columnRef,
    trackRef,
    handleMouseEnter,
    handleMouseLeave,
    handlePointerDown,
    handlePointerMove,
    endPointerGesture,
  };
}
