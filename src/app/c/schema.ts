import { Product } from "@/shared/lib/catalog/types";
import { SITE_URL } from "@/shared/lib/platform/seo";

/**
 * Build listing-page schema data for category and subcategory landing pages.
 */
export const buildCategoryListingSchema = ({
  categoryLabel,
  categorySlug,
  products,
  subCategoryLabel,
  subCategorySlug,
}: {
  categoryLabel: string;
  categorySlug: string;
  products: Product[];
  subCategoryLabel?: string;
  subCategorySlug?: string;
}) => {
  const categoryUrl = `${SITE_URL}/c/${categorySlug}`; // Canonical category URL.
  const pageUrl =
    subCategoryLabel && subCategorySlug
      ? `${categoryUrl}/${subCategorySlug}`
      : categoryUrl; // Canonical page URL for this listing.

  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: categoryLabel,
      item: categoryUrl,
    },
  ]; // Base breadcrumb trail for category routes.

  if (subCategoryLabel) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: subCategoryLabel,
      item: pageUrl,
    }); // Add subcategory node when this is a nested listing page.
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": `${pageUrl}#breadcrumb`,
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      },
      {
        "@id": `${pageUrl}#itemlist`,
        "@type": "ItemList",
        name: subCategoryLabel
          ? `${subCategoryLabel} Finds`
          : `${categoryLabel} Finds`,
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.name,
          url: `${SITE_URL}/product/${product.slug}`,
        })),
      },
    ],
  }; // Listing schema for discovery + richer crawl context.
};

