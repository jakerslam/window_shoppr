import { toCategorySlug } from "@/shared/lib/catalog/categories";
import { Product } from "@/shared/lib/catalog/types";

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

