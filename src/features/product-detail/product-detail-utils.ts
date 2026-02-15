/**
 * Format a numeric price into a USD string.
 */
export const formatPrice = (price: number) => `$${price.toFixed(2)}`;

/**
 * Clamp a numeric value between min and max bounds.
 */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
