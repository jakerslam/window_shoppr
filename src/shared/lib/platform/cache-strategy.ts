import { PUBLIC_ENV } from "@/shared/lib/platform/env";

export const PRODUCT_LIST_REVALIDATE_SECONDS = 300; // Refresh product feed data every 5 minutes in runtime mode.
export const PRODUCT_DETAIL_REVALIDATE_SECONDS = 900; // Refresh product detail data every 15 minutes in runtime mode.

/**
 * Return whether runtime ISR-like caching should be used.
 */
export const isRuntimeCacheMode = () => PUBLIC_ENV.deployTarget === "runtime";

/**
 * Build Next.js fetch-cache options for catalog list reads.
 */
export const getCatalogListCacheConfig = () => {
  if (!isRuntimeCacheMode()) {
    return undefined; // Keep static-export mode behavior unchanged.
  }

  return {
    cache: "force-cache" as const,
    next: {
      revalidate: PRODUCT_LIST_REVALIDATE_SECONDS,
      tags: ["catalog:products"],
    },
  };
};

/**
 * Build Next.js fetch-cache options for product detail reads.
 */
export const getProductDetailCacheConfig = (slug: string) => {
  if (!isRuntimeCacheMode()) {
    return undefined; // Keep static-export mode behavior unchanged.
  }

  return {
    cache: "force-cache" as const,
    next: {
      revalidate: PRODUCT_DETAIL_REVALIDATE_SECONDS,
      tags: ["catalog:products", `catalog:product:${slug}`],
    },
  };
};

