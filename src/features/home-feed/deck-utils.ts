import { Product } from "@/shared/lib/types";
import { toCategorySlug } from "@/shared/lib/categories";
import { TasteProfile } from "@/shared/lib/taste-profile";

/**
 * Normalize text for consistent search matching.
 */
export const normalizeText = (value: string) => value.trim().toLowerCase();

/**
 * Build a weighted preference map from recently viewed products.
 */
const buildPreferenceWeights = (
  recentlyViewedIds: string[],
  productLookup: Map<string, Product>,
) => {
  const categoryWeights = new Map<string, number>();
  const subCategoryWeights = new Map<string, number>();
  const tagWeights = new Map<string, number>();

  recentlyViewedIds.forEach((id, index) => {
    const product = productLookup.get(id);

    if (!product) {
      return; // Skip IDs that are not in the current catalog.
    }

    const recencyBoost =
      (recentlyViewedIds.length - index) / recentlyViewedIds.length; // Weight newer views higher.
    const categoryKey = toCategorySlug(product.category); // Normalize category to a slug key.
    const subCategoryKey = product.subCategory
      ? toCategorySlug(product.subCategory)
      : undefined; // Normalize subcategory to a slug key.

    categoryWeights.set(
      categoryKey,
      (categoryWeights.get(categoryKey) ?? 0) + 3 * recencyBoost,
    ); // Emphasize matched categories.

    if (subCategoryKey) {
      subCategoryWeights.set(
        subCategoryKey,
        (subCategoryWeights.get(subCategoryKey) ?? 0) + 2 * recencyBoost,
      ); // Emphasize matched subcategories.
    }

    (product.tags ?? []).forEach((tag) => {
      const tagKey = tag.toLowerCase();
      tagWeights.set(tagKey, (tagWeights.get(tagKey) ?? 0) + 1 * recencyBoost); // Light tag weight.
    });
  });

  return { categoryWeights, subCategoryWeights, tagWeights };
};

/**
 * Rank products for each user using recently viewed preferences.
 */
export const rankProductsForUser = (
  products: Product[],
  recentlyViewedIds: string[],
  applyPersonalization: boolean,
  options?: {
    tasteProfile?: TasteProfile | null;
    preferredCategorySlugs?: string[];
  },
) => {
  if (!applyPersonalization) {
    return products; // Respect explicit sorting when personalization is off.
  }

  const productLookup = new Map(products.map((product) => [product.id, product]));
  const { categoryWeights, subCategoryWeights, tagWeights } =
    buildPreferenceWeights(recentlyViewedIds, productLookup); // Build weighted preferences.

  const preferredCategorySlugs = options?.preferredCategorySlugs ?? [];
  const tasteProfile = options?.tasteProfile ?? null;
  const tasteEnabled = tasteProfile?.personalizationEnabled ?? true;

  return products
    .map((product, index) => {
      const categoryKey = toCategorySlug(product.category); // Normalize category key for consistent weighting.
      const subCategoryKey = product.subCategory
        ? toCategorySlug(product.subCategory)
        : undefined; // Normalize subcategory key for consistent weighting.
      const tagScore = (product.tags ?? []).reduce(
        (total, tag) => total + (tagWeights.get(tag.toLowerCase()) ?? 0),
        0,
      ); // Sum tag weights for the product.
      const preferredBoost = preferredCategorySlugs.includes(categoryKey) ? 4 : 0; // Boost user-selected categories.

      const tasteTagScore = tasteProfile
        ? (product.tags ?? []).reduce((total, tag) => {
            const tagKey = normalizeText(tag);
            return total + (tasteProfile.tagWeights[tagKey] ?? 0);
          }, 0)
        : 0; // Sum onboarding + trickle taste tag weights.

      const clampedTasteTagScore = Math.min(4, Math.max(-4, tasteTagScore)); // Keep tag contribution bounded.
      const tasteCategoryWeight = tasteProfile?.categoryWeights[categoryKey] ?? 0; // Read category weight when present.
      const tasteBoost = tasteEnabled
        ? tasteCategoryWeight * 0.45 + clampedTasteTagScore
        : 0; // Apply taste profile scoring only when enabled.

      const score =
        (categoryWeights.get(categoryKey) ?? 0) +
        (subCategoryKey ? subCategoryWeights.get(subCategoryKey) ?? 0 : 0) +
        Math.min(tagScore, 3) +
        preferredBoost +
        tasteBoost; // Combine recency and taste-driven boosts.

      return {
        product,
        score,
        index,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score; // Higher personalization score first.
      }

      return a.index - b.index; // Preserve original ordering for ties.
    })
    .map((entry) => entry.product);
};

/**
 * Split products into column decks for the animated feed.
 */
export const buildCardDecks = (
  products: Product[],
  columnCount: number,
  minimumPerColumn: number,
) => {
  const decks: Product[][] = Array.from({ length: columnCount }, () => []);

  if (products.length === 0) {
    return decks; // Keep empty decks when no results are available.
  }

  const targetSize = columnCount * minimumPerColumn; // Ensure enough cards to loop smoothly.
  const deckPool: Product[] = []; // Working list that supplies the decks.

  while (deckPool.length < targetSize) {
    deckPool.push(...products); // Repeat products until we fill the deck pool.
  }

  deckPool.slice(0, targetSize).forEach((product, index) => {
    decks[index % columnCount].push(product); // Distribute cards across columns.
  });

  return decks;
};
