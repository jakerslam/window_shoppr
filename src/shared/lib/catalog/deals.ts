/**
 * Determine whether the deal window is currently active.
 */
export const isDealWindowActive = (dealEndsAt?: string) => {
  if (!dealEndsAt) {
    return true; // Treat deals without an explicit end date as active.
  }

  const endTime = new Date(dealEndsAt).getTime();
  if (Number.isNaN(endTime)) {
    return false; // Hide deal-only UI when expiration date is invalid.
  }

  return endTime > Date.now();
};

/**
 * Format the remaining deal time for active deal windows.
 */
export const formatDealTimeRemaining = (dealEndsAt?: string) => {
  if (!dealEndsAt || !isDealWindowActive(dealEndsAt)) {
    return null; // Hide countdown once deal has expired (or is invalid).
  }

  const endTime = new Date(dealEndsAt).getTime();
  const diffMs = endTime - Date.now();
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
