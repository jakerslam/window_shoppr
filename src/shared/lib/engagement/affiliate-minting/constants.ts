export const AFFILIATE_MINT_CREATED_EVENT = "affiliate:mint:queued"; // Broadcast when a new mint job is queued.
export const AFFILIATE_MINT_UPDATED_EVENT = "affiliate:mint:updated"; // Broadcast when a mint job updates state.

export const KNOWN_AFFILIATE_HOST_HINTS = [
  "amazon.",
  "amzn.to",
  "linksynergy.com",
  "dpbolvw.net",
  "tkqlhce.com",
  "rstyle.me",
  "shop-links.co",
  "redirectingat.com",
]; // Host hints allowed for affiliate-replaced URLs in local compliance checks.

export const BLOCKED_SIGNAL_HOST_HINTS = ["slickdeals.net"]; // Never treat source-signal URLs as final affiliate destinations.
