"use client";

import { PUBLIC_ENV } from "@/shared/lib/platform/env";

/**
 * Parse the configured origin allowlist into normalized origin values.
 */
const parseAllowedOrigins = () =>
  PUBLIC_ENV.allowedOrigins
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);

/**
 * Return true when an origin is explicitly allowlisted.
 */
export const isOriginAllowed = (origin: string) => {
  const allowlist = parseAllowedOrigins();
  return allowlist.includes(origin);
};

/**
 * Enforce deny-by-default origin policy for mutation requests.
 */
export const canSendMutationFromCurrentOrigin = () => {
  if (typeof window === "undefined") {
    return false; // Mutation calls are browser-originated; deny in SSR contexts.
  }

  const currentOrigin = window.location.origin;
  return isOriginAllowed(currentOrigin);
};
