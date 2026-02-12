import type { MetadataRoute } from "next";
import { fetchProducts } from "@/shared/lib/data";
import { SITE_URL } from "@/shared/lib/seo";

export const dynamic = "force-static"; // Required for static export.

/**
 * Build a sitemap with the homepage and product detail routes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchProducts(); // Load products for URL generation.
  const lastModified = new Date(); // Stamp entries with current build time.

  const productEntries = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`, // Link to product detail page.
    lastModified, // Reuse the same timestamp for now.
  }));

  return [
    {
      url: SITE_URL, // Link to the homepage.
      lastModified, // Apply timestamp to the homepage entry.
    },
    ...productEntries,
  ];
}
