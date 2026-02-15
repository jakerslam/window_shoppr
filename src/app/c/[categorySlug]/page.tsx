import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeFeed from "@/features/home-feed/HomeFeed";
import { getAvailableCategories, toCategorySlug } from "@/shared/lib/categories";
import { fetchProducts } from "@/shared/lib/data";
import { buildMetaDescription, SITE_URL } from "@/shared/lib/seo";

export const dynamicParams = false; // Pre-render available category pages for static export.

/**
 * Generate static params for every category that meets the minimum content threshold.
 */
export async function generateStaticParams() {
  const products = await fetchProducts(); // Load products for availability checks.
  const availableCategories = getAvailableCategories(products); // Gate pages until content exists.

  return availableCategories.map((category) => ({
    categorySlug: toCategorySlug(category.label), // Normalize label into a route slug.
  }));
}

/**
 * Generate SEO metadata for category landing pages.
 */
export async function generateMetadata({
  params,
}: {
  params: { categorySlug: string } | Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params; // Support async params when applicable.
  const categorySlug = decodeURIComponent(resolvedParams.categorySlug); // Normalize input for lookup.
  const products = await fetchProducts(); // Load products for availability checks.
  const availableCategories = getAvailableCategories(products); // Gate pages until content exists.
  const category = availableCategories.find(
    (entry) => toCategorySlug(entry.label) === categorySlug,
  ); // Match the requested category slug.

  if (!category) {
    notFound(); // Surface 404 when category is missing or below threshold.
  }

  const canonicalUrl = `${SITE_URL}/c/${categorySlug}`; // Canonical URL for search engines.
  const description = buildMetaDescription(
    `Browse today's ${category.label} finds on Window Shoppr — cozy picks, trending products, and deal-friendly favorites.`,
  ); // Build a concise meta description.

  return {
    title: `${category.label} Finds`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${category.label} Finds`,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${category.label} Finds`,
      description,
    },
  };
}

/**
 * Category landing page that renders the home feed filtered to the given category.
 */
export default async function CategoryPage({
  params,
}: {
  params: { categorySlug: string } | Promise<{ categorySlug: string }>;
}) {
  const resolvedParams = await params; // Support async params when applicable.
  const categorySlug = decodeURIComponent(resolvedParams.categorySlug); // Normalize category slug.
  const products = await fetchProducts(); // Load products from SQL or JSON fallback.
  const availableCategories = getAvailableCategories(products); // Gate pages until content exists.
  const category = availableCategories.find(
    (entry) => toCategorySlug(entry.label) === categorySlug,
  ); // Match category slug against availability data.

  if (!category) {
    notFound(); // Surface 404 when category is missing or below threshold.
  }

  const categoryProducts = products.filter(
    (product) => toCategorySlug(product.category) === categorySlug,
  ); // Server-filter products so the initial HTML is category-specific for SEO.

  return (
    <HomeFeed
      products={categoryProducts}
      title={`Today's ${category.label} Finds`} // Ensure the header is correct on first render for direct visits.
    />
  ); // Render the feed with category-scoped data.
}
