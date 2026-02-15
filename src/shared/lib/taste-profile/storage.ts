import { createDefaultTasteProfile, TasteProfile } from "./model";

export const TASTE_PROFILE_STORAGE_KEY = "window-shoppr-taste-profile";

/**
 * Parse a persisted taste profile payload safely.
 */
const parseTasteProfile = (rawValue: string | null): TasteProfile | null => {
  if (!rawValue) {
    return null; // Skip parsing when storage is empty.
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<TasteProfile>;

    if (parsed.version !== 1) {
      return null; // Ignore payloads from unknown versions.
    }

    const personalizationEnabled =
      typeof parsed.personalizationEnabled === "boolean"
        ? parsed.personalizationEnabled
        : true;

    const hasOnboarded =
      typeof parsed.hasOnboarded === "boolean" ? parsed.hasOnboarded : false;

    const categoryWeights =
      typeof parsed.categoryWeights === "object" && parsed.categoryWeights
        ? (parsed.categoryWeights as Record<string, number>)
        : {};

    const tagWeights =
      typeof parsed.tagWeights === "object" && parsed.tagWeights
        ? (parsed.tagWeights as Record<string, number>)
        : {};

    return {
      version: 1,
      personalizationEnabled,
      hasOnboarded,
      categoryWeights,
      tagWeights,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch (error) {
    void error; // Ignore malformed storage payloads.
    return null;
  }
};

/**
 * Read the saved taste profile on the client.
 */
export const readTasteProfile = (): TasteProfile | null => {
  if (typeof window === "undefined") {
    return null; // Skip local storage access during SSR.
  }

  const stored = window.localStorage.getItem(TASTE_PROFILE_STORAGE_KEY); // Load stored profile JSON.
  return parseTasteProfile(stored); // Parse and validate stored profile.
};

/**
 * Persist the taste profile and notify listeners in the current tab.
 */
export const writeTasteProfile = (profile: TasteProfile) => {
  if (typeof window === "undefined") {
    return; // Skip storage updates during SSR.
  }

  window.localStorage.setItem(
    TASTE_PROFILE_STORAGE_KEY,
    JSON.stringify(profile),
  ); // Persist the latest preference payload.
  window.dispatchEvent(
    new CustomEvent("taste-profile:updated", { detail: { profile } }),
  ); // Notify same-tab listeners that preferences changed.
};

/**
 * Clear the taste profile from local storage and notify listeners.
 */
export const clearTasteProfile = () => {
  if (typeof window === "undefined") {
    return; // Skip storage updates during SSR.
  }

  window.localStorage.removeItem(TASTE_PROFILE_STORAGE_KEY); // Remove persisted taste profile.
  window.dispatchEvent(
    new CustomEvent("taste-profile:updated", { detail: { profile: null } }),
  ); // Notify listeners that preferences were cleared.
};

/**
 * Return the active taste profile, falling back to defaults when missing.
 */
export const getTasteProfile = (): TasteProfile | null => {
  if (typeof window === "undefined") {
    return null; // Skip local storage access during SSR.
  }

  return readTasteProfile() ?? createDefaultTasteProfile(); // Ensure callers always have a usable profile.
};
