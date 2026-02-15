import { toCategorySlug } from "@/shared/lib/categories";
import { Product } from "@/shared/lib/types";

export const TASTE_PROFILE_STORAGE_KEY = "window-shoppr-taste-profile";

export type TastePreferenceSignal = "like" | "dislike";

export type TasteProfile = {
  version: 1;
  personalizationEnabled: boolean;
  hasOnboarded: boolean;
  categoryWeights: Record<string, number>;
  tagWeights: Record<string, number>;
  updatedAt: string;
};

const MAX_WEIGHT = 24;
const MIN_WEIGHT = -24;

/**
 * Clamp a taste weight to keep scores stable and predictable.
 */
const clampWeight = (value: number) =>
  Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, value));

/**
 * Normalize tag strings to a consistent key format.
 */
const normalizeTagKey = (value: string) => value.trim().toLowerCase();

/**
 * Create a fresh default taste profile payload.
 */
export const createDefaultTasteProfile = (): TasteProfile => ({
  version: 1,
  personalizationEnabled: true,
  hasOnboarded: false,
  categoryWeights: {},
  tagWeights: {},
  updatedAt: new Date().toISOString(),
});

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

/**
 * Toggle personalization without mutating existing weights.
 */
export const setTastePersonalizationEnabled = (
  profile: TasteProfile,
  personalizationEnabled: boolean,
) => ({
  ...profile,
  personalizationEnabled,
  updatedAt: new Date().toISOString(),
});

/**
 * Apply a like/dislike signal for a product into the taste profile weights.
 */
export const applyTasteSignal = (
  profile: TasteProfile,
  product: Product,
  signal: TastePreferenceSignal,
) => {
  const delta = signal === "like" ? 1 : -1; // Positive for likes, negative for dislikes.
  const categorySlug = toCategorySlug(product.category); // Normalize category key for consistent weighting.

  const nextCategoryWeights = { ...profile.categoryWeights }; // Copy category weight map for immutability.
  const nextTagWeights = { ...profile.tagWeights }; // Copy tag weight map for immutability.

  nextCategoryWeights[categorySlug] = clampWeight(
    (nextCategoryWeights[categorySlug] ?? 0) + 3 * delta,
  ); // Apply a heavier category bump.

  (product.tags ?? []).forEach((tag) => {
    const tagKey = normalizeTagKey(tag); // Normalize tags for consistent weighting.
    if (!tagKey) {
      return;
    }

    nextTagWeights[tagKey] = clampWeight(
      (nextTagWeights[tagKey] ?? 0) + 1 * delta,
    ); // Apply a lighter tag bump.
  });

  return {
    ...profile,
    hasOnboarded: true,
    categoryWeights: nextCategoryWeights,
    tagWeights: nextTagWeights,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Apply onboarding quiz selections as baseline taste weights.
 */
export const applyTasteQuizSelections = (
  profile: TasteProfile,
  selectedCategorySlugs: string[],
  selectedVibeTags: string[],
) => {
  const nextCategoryWeights = { ...profile.categoryWeights }; // Copy category weight map for immutability.
  const nextTagWeights = { ...profile.tagWeights }; // Copy tag weight map for immutability.

  selectedCategorySlugs.forEach((slug) => {
    if (!slug) {
      return;
    }

    nextCategoryWeights[slug] = clampWeight(
      Math.max(nextCategoryWeights[slug] ?? 0, 6),
    ); // Promote selected categories as a baseline preference.
  });

  selectedVibeTags.forEach((tag) => {
    const tagKey = normalizeTagKey(tag); // Normalize tags for consistent weighting.
    if (!tagKey) {
      return;
    }

    nextTagWeights[tagKey] = clampWeight(
      Math.max(nextTagWeights[tagKey] ?? 0, 3),
    ); // Promote selected vibes as a lightweight preference.
  });

  return {
    ...profile,
    hasOnboarded: true,
    categoryWeights: nextCategoryWeights,
    tagWeights: nextTagWeights,
    updatedAt: new Date().toISOString(),
  };
};
