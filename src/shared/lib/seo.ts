import { PUBLIC_ENV } from "@/shared/lib/env";

/**
 * Canonical site URL for metadata, override with NEXT_PUBLIC_SITE_URL.
 */
export const SITE_URL = PUBLIC_ENV.siteUrl; // Use validated env with a safe fallback.

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
