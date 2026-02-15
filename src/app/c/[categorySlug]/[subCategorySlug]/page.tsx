import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeFeed from "@/features/home-feed/HomeFeed";
import { getAvailableCategories, toCategorySlug } from "@/shared/lib/categories";
import { fetchProducts } from "@/shared/lib/data";
import { buildMetaDescription, SITE_URL } from "@/shared/lib/seo";

export const dynamicParams = false; // Pre-render available subcategory pages for static export.

/**
 * Generate static params for every subcategory that meets the minimum content threshold.
 */
export async function generateStaticParams() {
  const products = await fetchProducts(); // Load products for availability checks.
  const availableCategories = getAvailableCategories(products); // Gate pages until content exists.

  return availableCategories.flatMap((category) => {
    const categorySlug = toCategorySlug(category.label); // Normalize label into a route slug.
    return category.subCategories.map((subCategory) => ({
      categorySlug,
      subCategorySlug: toCategorySlug(subCategory), // Normalize subcategory label into a slug.
    }));
  });
}

/**
 * Generate SEO metadata for subcategory landing pages.
 */
export async function generateMetadata({
  params,
}: {
  params:
    | { categorySlug: string; subCategorySlug: string }
    | Promise<{ categorySlug: string; subCategorySlug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params; // Support async params when applicable.
  const categorySlug = decodeURIComponent(resolvedParams.categorySlug); // Normalize category input.
  const subCategorySlug = decodeURIComponent(resolvedParams.subCategorySlug); // Normalize subcategory input.
  const products = await fetchProducts(); // Load products for availability checks.
  const availableCategories = getAvailableCategories(products); // Gate pages until content exists.
  const category = availableCategories.find(
    (entry) => toCategorySlug(entry.label) === categorySlug,
  ); // Match requested category.

  if (!category) {
    notFound(); // Surface 404 when category is missing or below threshold.
  }

  const subCategoryLabel =
    category.subCategories.find(
      (label) => toCategorySlug(label) === subCategorySlug,
    ) ?? null; // Match the requested subcategory slug.

  if (!subCategoryLabel) {
    notFound(); // Surface 404 when subcategory is missing or below threshold.
  }

  const canonicalUrl = `${SITE_URL}/c/${categorySlug}/${subCategorySlug}`; // Canonical URL for search engines.
  const description = buildMetaDescription(
    `Browse today's ${subCategoryLabel} finds in ${category.label} on Window Shoppr — cozy picks, trending products, and deal-friendly favorites.`,
  ); // Build a concise meta description.

  const title = `${subCategoryLabel} Finds`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/**
 * Subcategory landing page that renders the home feed filtered to the given subcategory.
 */
export default async function SubCategoryPage({
  params,
}: {
  params:
    | { categorySlug: string; subCategorySlug: string }
    | Promise<{ categorySlug: string; subCategorySlug: string }>;
}) {
  const resolvedParams = await params; // Support async params when applicable.
  const categorySlug = decodeURIComponent(resolvedParams.categorySlug); // Normalize category slug.
  const subCategorySlug = decodeURIComponent(resolvedParams.subCategorySlug); // Normalize subcategory slug.
  const products = await fetchProducts(); // Load products from SQL or JSON fallback.
  const availableCategories = getAvailableCategories(products); // Gate pages until content exists.
  const category = availableCategories.find(
    (entry) => toCategorySlug(entry.label) === categorySlug,
  ); // Match category slug.

  if (!category) {
    notFound(); // Surface 404 when category is missing or below threshold.
  }

  const subCategoryLabel =
    category.subCategories.find(
      (label) => toCategorySlug(label) === subCategorySlug,
    ) ?? null; // Match subcategory slug.

  if (!subCategoryLabel) {
    notFound(); // Surface 404 when subcategory is missing or below threshold.
  }

  const scopedProducts = products.filter((product) => {
    const matchesCategory = toCategorySlug(product.category) === categorySlug; // Match category slug.
    const matchesSubCategory =
      product.subCategory &&
      toCategorySlug(product.subCategory) === subCategorySlug; // Match subcategory slug.
    return matchesCategory && matchesSubCategory;
  }); // Server-filter products so the initial HTML is subcategory-specific for SEO.

  return (
    <HomeFeed
      products={scopedProducts}
      title={`Today's ${subCategoryLabel} Finds`} // Ensure the header is correct on first render for direct visits.
    />
  ); // Render the feed with subcategory-scoped data.
}

