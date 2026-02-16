export const DEFAULT_COLUMN_COUNT = 5; // Desktop feed column count.

/**
 * Resolve the feed column count from viewport width.
 */
export const getFeedColumnCount = (viewportWidth: number) => {
  if (viewportWidth <= 820) {
    return 2; // Mobile layout uses two columns.
  }

  if (viewportWidth <= 1024) {
    return 3; // Tablet layout uses three columns.
  }

  if (viewportWidth <= 1200) {
    return 4; // Small desktop layout uses four columns.
  }

  return DEFAULT_COLUMN_COUNT; // Full desktop layout.
};
