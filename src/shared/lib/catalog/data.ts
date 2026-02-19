import { Product } from "@/shared/lib/catalog/types";
import { ProductCatalogSchema, ProductSchema } from "@/shared/lib/catalog/schema";
import {
  FALLBACK_PRODUCTS,
  isPublishedProduct,
  normalizeCatalogSource,
  normalizeProductSource,
} from "@/shared/lib/catalog/products";
import {
  getCatalogListCacheConfig,
  getProductDetailCacheConfig,
} from "@/shared/lib/platform/cache-strategy";
import { requestDataApi } from "@/shared/lib/platform/data-api";
import { PUBLIC_ENV } from "@/shared/lib/platform/env";

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
 * Determine whether JSON fallback is allowed for the current deployment profile.
 */
const isJsonFallbackAllowed = () => {
  if (PUBLIC_ENV.deployTarget === "static-export") {
    return true; // Static export requires local JSON compatibility.
  }

  return PUBLIC_ENV.allowJsonFallback; // Runtime deployments can disable fallback explicitly.
};

/**
 * Normalize product-list payloads from SQL data API responses.
 */
const parseProductListPayload = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload as Product[]; // Support direct list responses.
  }

  if (
    payload &&
    typeof payload === "object" &&
    "products" in payload &&
    Array.isArray((payload as { products?: unknown }).products)
  ) {
    return (payload as { products: Product[] }).products; // Support enveloped list responses.
  }

  return null;
};

/**
 * Normalize single-product payloads from SQL data API responses.
 */
const parseProductPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return null; // Ignore invalid product payloads.
  }

  if ("product" in payload && (payload as { product?: unknown }).product) {
    return (payload as { product: Product }).product; // Support enveloped product responses.
  }

  return payload as Product; // Support direct product responses.
};

/**
 * SQL-backed product retrieval via configurable external data API.
 */
export const fetchProductsFromSql = async (): Promise<Product[] | null> => {
  const response = await requestDataApi<unknown>({
    path: "/data/products",
    method: "GET",
    cacheConfig: getCatalogListCacheConfig(),
  }); // Request catalog rows from external SQL-backed API.
  if (!response || !response.ok) {
    return null; // Fall back to JSON when API is unavailable or returns errors.
  }

  return parseProductListPayload(response.data);
};

/**
 * SQL-backed single product retrieval via configurable external data API.
 */
export const fetchProductBySlugFromSql = async (
  slug: string,
): Promise<Product | null> => {
  const response = await requestDataApi<unknown>({
    path: `/data/products/${encodeURIComponent(slug)}`,
    method: "GET",
    cacheConfig: getProductDetailCacheConfig(slug),
  }); // Request single product row by slug from external API.
  if (!response || !response.ok) {
    return null; // Fall back to JSON when API is unavailable or returns errors.
  }

  return parseProductPayload(response.data);
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
    const validated = ProductCatalogSchema.parse(sqlProducts); // Validate SQL data before display.
    return normalizeCatalogSource(validated, "sql").filter(isPublishedProduct); // Normalize SQL metadata + enforce publish visibility.
  }

  if (!isJsonFallbackAllowed()) {
    throw new Error(
      "Production data source unavailable: SQL/API catalog is required and JSON fallback is disabled.",
    );
  }

  return normalizeCatalogSource(FALLBACK_PRODUCTS, "json").filter(isPublishedProduct); // Normalize JSON metadata + enforce publish visibility.
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
    const validated = ProductSchema.parse(sqlProduct); // Validate SQL data before display.
    return normalizeProductSource(validated, "sql"); // Normalize SQL source metadata.
  }

  if (!isJsonFallbackAllowed()) {
    throw new Error(
      "Production data source unavailable: SQL/API product detail is required and JSON fallback is disabled.",
    );
  }

  const jsonProduct =
    FALLBACK_PRODUCTS.find((product) => product.slug === slug) ?? null; // Match by slug.

  if (!jsonProduct) {
    return null; // Match previous null behavior when slug is unknown.
  }

  const normalized = normalizeProductSource(jsonProduct, "json"); // Normalize JSON metadata when present.
  return isPublishedProduct(normalized) ? normalized : null; // Hide draft/unpublished items from public routes.
};
