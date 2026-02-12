import productsJson from "@/data/products.json";
import { Product } from "@/shared/lib/types";

const DEV_LOADING_DELAY_MS = 400; // Artificial delay to preview loading UI in dev.

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldDelay = () => process.env.NODE_ENV === "development"; // Only delay in dev.


/**
 * Placeholder for future SQL-backed product retrieval.
 */
export const fetchProductsFromSql = async (): Promise<Product[] | null> => {
  return null; // TODO: replace with SQL query logic.
};

/**
 * Placeholder for future SQL-backed single product retrieval.
 */
export const fetchProductBySlugFromSql = async (
  slug: string,
): Promise<Product | null> => {
  void slug; // TODO: use slug when SQL is wired.
  return null; // TODO: replace with SQL query logic.
};

/**
 * Load all products, preferring SQL when available, otherwise JSON fallback.
 */
export const fetchProducts = async (): Promise<Product[]> => {
  if (shouldDelay()) {
    await delay(DEV_LOADING_DELAY_MS); // Simulate network latency in dev.
  }
  const sqlProducts = await fetchProductsFromSql(); // Prefer SQL when available.

  if (sqlProducts && sqlProducts.length > 0) {
    return sqlProducts; // Use SQL results when present.
  }

  return productsJson as Product[]; // Fall back to local JSON.
};

/**
 * Load a single product by slug, preferring SQL when available.
 */
export const fetchProductBySlug = async (
  slug: string,
): Promise<Product | null> => {
  if (shouldDelay()) {
    await delay(DEV_LOADING_DELAY_MS); // Simulate network latency in dev.
  }
  const sqlProduct = await fetchProductBySlugFromSql(slug); // Prefer SQL when available.

  if (sqlProduct) {
    return sqlProduct; // Use SQL result when present.
  }

  const jsonProducts = productsJson as Product[]; // Fall back to local JSON.

  return jsonProducts.find((product) => product.slug === slug) ?? null; // Match by slug.
};
