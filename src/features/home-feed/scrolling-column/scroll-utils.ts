export const DRAG_START_THRESHOLD_PX = 6; // Minimum movement before we treat touch input as a drag gesture.
export const WHEEL_LINE_HEIGHT_PX = 18; // Approximate pixel height for wheel deltaMode line scrolling.
export const WHEEL_VELOCITY_SCALE = 1.6; // Convert wheel pixels into a temporary velocity impulse.
export const TOUCH_VELOCITY_SCALE = 0.85; // Convert touch drag velocity into a temporary velocity impulse.
export const MANUAL_VELOCITY_DECAY = 1.15; // Exponential decay (per second) back toward the baseline auto-scroll.
export const MIN_MANUAL_VELOCITY = 6; // Smallest velocity magnitude worth keeping before snapping to 0.
export const MAX_MANUAL_SPEED_MULTIPLIER = 7; // Clamp manual speed to a multiple of the baseline auto-scroll.

/**
 * Normalize a scroll position into a 0..loopHeight range (handles negative modulo).
 */
export const normalizeLoopPosition = (position: number, loopHeight: number) => {
  const modulo = position % loopHeight; // Wrap position using modulo arithmetic.
  return modulo < 0 ? modulo + loopHeight : modulo; // Convert negative modulo results into a positive range.
};

/**
 * Convert a wheel event delta into pixels.
 */
export const toWheelPixels = (event: WheelEvent, pageHeightPx: number) => {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * WHEEL_LINE_HEIGHT_PX; // Normalize line-based wheel deltas.
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * pageHeightPx; // Approximate a page as the supplied height.
  }

  return event.deltaY; // Pixels already.
};

