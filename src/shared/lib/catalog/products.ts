import productsJson from "@/data/products.json";
import { ProductCatalogSchema } from "@/shared/lib/catalog/schema";
import { Product } from "@/shared/lib/catalog/types";

/**
 * Static product catalog fallback for client-only experiences.
 */
export const FALLBACK_PRODUCTS = ProductCatalogSchema.parse(productsJson); // Validate JSON fallback at module load.

/**
 * Shared product catalog getter for category gating.
 */
export const getProductCatalog = () => FALLBACK_PRODUCTS; // Expose fallback catalog.

/**
 * Attach source metadata defaults to a product.
 */
export const normalizeProductSource = (product: Product, source: string) => {
  const externalId = product.externalId ?? product.id; // Fall back to internal id.

  return {
    ...product,
    source: product.source ?? source, // Tag the product source.
    externalId,
    lastSeenAt: product.lastSeenAt,
    lastPriceCheckAt: product.lastPriceCheckAt,
  };
};

/**
 * Attach source metadata to a catalog of products.
 */
export const normalizeCatalogSource = (products: Product[], source: string) =>
  products.map((product) => normalizeProductSource(product, source));

/**
 * Build a stable idempotency key for product upserts.
 */
export const buildProductIdempotencyKey = (
  product: Pick<Product, "source" | "externalId" | "id">,
) => `${product.source ?? "unknown"}:${product.externalId ?? product.id}`;
