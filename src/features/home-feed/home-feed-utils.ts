import type { Product } from "@/shared/lib/catalog/types";

/**
 * Format a category slug into a display-ready label.
 */
export const formatCategoryLabel = (categorySource: string) => {
  if (!categorySource) {
    return ""; // Skip formatting when no category is selected.
  }

  const formatted = categorySource.replace(/-/g, " "); // Replace slug separators.

  return formatted.replace(/\b\w/g, (char) => char.toUpperCase()); // Title-case each word.
};

export const SPONSORED_INTERVAL = 8;
export const MAX_SPONSORED_CARDS = 3;

/**
 * Interleave sponsored content into the feed so sponsored cards appear at steady intervals.
 */
export const interleaveSponsoredProducts = (products: Product[]) => {
  if (products.length === 0) {
    return [];
  }

  const sponsored = products
    .filter((product) => product.isSponsored)
    .slice(0, MAX_SPONSORED_CARDS);
  const organic = products.filter((product) => !product.isSponsored);

  if (sponsored.length === 0) {
    return organic.length === 0 ? products : [...organic];
  }

  if (organic.length === 0) {
    return [...sponsored];
  }

  const spaced: Product[] = [];
  let sponsorIndex = 0;

  organic.forEach((product, index) => {
    spaced.push(product);
    if (
      (index + 1) % SPONSORED_INTERVAL === 0 &&
      sponsorIndex < sponsored.length
    ) {
      spaced.push(sponsored[sponsorIndex]);
      sponsorIndex += 1;
    }
  });

  if (sponsorIndex < sponsored.length) {
    spaced.push(sponsored[sponsorIndex]);
  }

  return spaced;
};
