/**
 * Format a numeric price into a USD string.
 */
export const formatPrice = (price: number) => `$${price.toFixed(2)}`;

/**
 * Clamp a numeric value between min and max bounds.
 */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Format time remaining until a deal expires.
 */
export const formatTimeRemaining = (dealEndsAt?: string) => {
  if (!dealEndsAt) {
    return null; // No timer when deal end is missing.
  }

  const endTime = new Date(dealEndsAt).getTime();
  const diffMs = endTime - Date.now();

  if (Number.isNaN(endTime) || diffMs <= 0) {
    return "Deal ended";
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Ends in ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Ends in ${hours}h ${minutes}m`;
  }

  return `Ends in ${minutes}m`;
};
