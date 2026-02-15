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

