import { Product } from "@/shared/lib/catalog/types";

/**
 * Split products into column decks for the animated feed.
 */
export const buildCardDecks = (
  products: Product[],
  columnCount: number,
) => {
  const decks: Product[][] = Array.from({ length: columnCount }, () => []);

  if (products.length === 0) {
    return decks; // Keep empty decks when no results are available.
  }

  products.forEach((product, index) => {
    decks[index % columnCount].push(product); // Distribute all cards across active columns; first columns receive any 1-card remainder.
  });

  return decks;
};
