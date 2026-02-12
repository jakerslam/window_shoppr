/**
 * Canonical site URL for metadata, override with NEXT_PUBLIC_SITE_URL.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://window-shoppr.com"; // Fallback base URL.

/**
 * Default max length for meta descriptions.
 */
const DESCRIPTION_MAX_LENGTH = 160; // Keep meta descriptions concise.

/**
 * Build a meta description within a character limit.
 */
export const buildMetaDescription = (
  text: string,
  maxLength = DESCRIPTION_MAX_LENGTH,
) => {
  const normalized = text.replace(/\s+/g, " ").trim(); // Normalize whitespace.

  if (normalized.length <= maxLength) {
    return normalized; // Return early when within limit.
  }

  return `${normalized.slice(0, maxLength - 3)}...`; // Trim and add ellipsis.
};
