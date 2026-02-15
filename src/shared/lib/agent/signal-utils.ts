const SIGNAL_REDIRECT_KEYS = [
  "url",
  "u",
  "out",
  "to",
  "dest",
  "destination",
  "redirect",
  "redirect_url",
  "redirectUrl",
  "r",
] as const; // Common query keys that hold redirected merchant URLs.

/**
 * Normalize URLs and reject non-http(s) values.
 */
export const normalizeHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
};

/**
 * Attempt to resolve a merchant URL from common signal redirect params.
 */
export const resolveMerchantUrlFromSignal = ({
  signalUrl,
  merchantUrl,
}: {
  signalUrl: string;
  merchantUrl?: string;
}) => {
  const normalizedMerchant = merchantUrl ? normalizeHttpUrl(merchantUrl) : null;
  if (normalizedMerchant) {
    return normalizedMerchant; // Prefer explicit merchant URL when provided.
  }

  const parsedSignal = new URL(signalUrl);
  for (const key of SIGNAL_REDIRECT_KEYS) {
    const candidate = parsedSignal.searchParams.get(key);
    if (!candidate) {
      continue;
    }

    const decoded = (() => {
      try {
        return decodeURIComponent(candidate);
      } catch {
        return candidate;
      }
    })();
    const normalized = normalizeHttpUrl(decoded);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};
