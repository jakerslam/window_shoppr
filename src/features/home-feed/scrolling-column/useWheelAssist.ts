"use client";

import { useEffect } from "react";
import type { MutableRefObject, RefObject } from "react";
import {
  MAX_MANUAL_SPEED_MULTIPLIER,
  WHEEL_VELOCITY_SCALE,
  normalizeLoopPosition,
  toWheelPixels,
} from "@/features/home-feed/scrolling-column/scroll-utils";

/**
 * Attach wheel listeners that nudge the column position + add a temporary velocity impulse.
 */
export default function useWheelAssist({
  columnRef,
  trackRef,
  loopHeightRef,
  positionRef,
  baseSpeedRef,
  manualVelocityRef,
  isInteractingRef,
  isModalOpenRef,
  isWishlistMenuOpenRef,
  triggerInteractionCooldown,
}: {
  columnRef: RefObject<HTMLDivElement | null>;
  trackRef: RefObject<HTMLDivElement | null>;
  loopHeightRef: MutableRefObject<number>;
  positionRef: MutableRefObject<number>;
  baseSpeedRef: MutableRefObject<number>;
  manualVelocityRef: MutableRefObject<number>;
  isInteractingRef: MutableRefObject<boolean>;
  isModalOpenRef: MutableRefObject<boolean>;
  isWishlistMenuOpenRef: MutableRefObject<boolean>;
  triggerInteractionCooldown: () => void;
}) {
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
      isInteractingRef.current = true; // Mark manual wheel interaction as active for cooldown pause.
      triggerInteractionCooldown(); // Delay auto-scroll resume until wheel input settles.

      const deltaPixels = toWheelPixels(event, loopHeight); // Convert the delta into pixel units.

      const nextPosition = normalizeLoopPosition(
        positionRef.current + deltaPixels,
        loopHeight,
      ); // Move the track immediately for responsiveness.
      positionRef.current = nextPosition; // Persist the updated position.
      track.style.transform = `translateY(-${nextPosition}px)`; // Apply the transform now.

      const baseSpeed = baseSpeedRef.current; // Baseline scroll speed for clamping.
      const maxManualSpeed = Math.max(120, baseSpeed * MAX_MANUAL_SPEED_MULTIPLIER);
      const nextManualVelocity =
        manualVelocityRef.current + deltaPixels * WHEEL_VELOCITY_SCALE;
      manualVelocityRef.current = Math.min(
        maxManualSpeed,
        Math.max(-maxManualSpeed, nextManualVelocity),
      ); // Add a temporary velocity impulse that decays back to 0.
    };

    column.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      column.removeEventListener("wheel", handleWheel); // Clean up wheel listener.
    };
  }, [
    baseSpeedRef,
    columnRef,
    isInteractingRef,
    isModalOpenRef,
    isWishlistMenuOpenRef,
    loopHeightRef,
    manualVelocityRef,
    positionRef,
    trackRef,
    triggerInteractionCooldown,
  ]);
}
