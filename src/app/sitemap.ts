import type { MetadataRoute } from "next";
import { fetchProducts } from "@/shared/lib/catalog/data";
import { SITE_URL } from "@/shared/lib/platform/seo";
import { getAvailableCategories, toCategorySlug } from "@/shared/lib/catalog/categories";

export const dynamic = "force-static"; // Required for static export.

/**
 * Build a sitemap with the homepage and product detail routes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchProducts(); // Load products for URL generation.
  const lastModified = new Date(); // Stamp entries with current build time.
  const availableCategories = getAvailableCategories(products); // Gate category pages until content exists.

  const productEntries = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`, // Link to product detail page.
    lastModified, // Reuse the same timestamp for now.
  }));

  const categoryEntries = availableCategories.flatMap((category) => {
    const categorySlug = toCategorySlug(category.label); // Normalize label into a route slug.
    const categoryUrl = `${SITE_URL}/c/${categorySlug}`; // Canonical category URL.

    const subEntries = category.subCategories.map((subCategory) => ({
      url: `${SITE_URL}/c/${categorySlug}/${toCategorySlug(subCategory)}`, // Canonical subcategory URL.
      lastModified,
    }));

    return [
      {
        url: categoryUrl,
        lastModified,
      },
      ...subEntries,
    ];
  });

  return [
    {
      url: SITE_URL, // Link to the homepage.
      lastModified, // Apply timestamp to the homepage entry.
    },
    ...categoryEntries,
    ...productEntries,
  ];
}
