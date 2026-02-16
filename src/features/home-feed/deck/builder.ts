import { Product } from "@/shared/lib/catalog/types";

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

  const targetSize = Math.max(minimumPerColumn * columnCount, products.length); // Keep compatibility with caller sizing while preventing duplicate injection.
  const boundedPool = products.slice(0, targetSize); // Use only real products so finite feeds actually end.

  boundedPool.forEach((product, index) => {
    decks[index % columnCount].push(product); // Distribute unique cards across columns for balanced finite lists.
  });

  return decks;
};
