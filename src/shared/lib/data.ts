import productsJson from "@/data/products.json";
import { Product } from "@/shared/lib/types";
import { normalizeCatalogSource, normalizeProductSource } from "@/shared/lib/products";

const DEV_LOADING_DELAY_MS = 400; // Artificial delay to preview loading UI in dev.

/**
 * Async delay helper for dev-only loading previews.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Determine whether to add dev-only delays.
 */
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
    return normalizeCatalogSource(sqlProducts, "sql"); // Normalize SQL source metadata.
  }

  return normalizeCatalogSource(productsJson as Product[], "json"); // Normalize JSON source metadata.
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
    return normalizeProductSource(sqlProduct, "sql"); // Normalize SQL source metadata.
  }

  const jsonProducts = productsJson as Product[]; // Fall back to local JSON.

  const jsonProduct = jsonProducts.find((product) => product.slug === slug) ?? null; // Match by slug.

  return jsonProduct
    ? normalizeProductSource(jsonProduct, "json")
    : null; // Normalize JSON metadata when present.
};
