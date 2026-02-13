import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/features/product-detail/ProductDetail";
import { fetchProductBySlug, fetchProducts } from "@/shared/lib/data";
import { buildMetaDescription, SITE_URL } from "@/shared/lib/seo";
import { Product } from "@/shared/lib/types";

/**
 * Build JSON-LD schema data for a product detail page.
 */
const buildProductSchema = (product: Product) => {
  const canonicalUrl = `${SITE_URL}/product/${product.slug}`; // Build canonical URL.
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: buildMetaDescription(product.description, 500), // Allow longer schema text.
    url: canonicalUrl,
  };

  if (product.retailer) {
    schema.brand = {
      "@type": "Brand",
      name: product.retailer,
    }; // Attach brand when retailer is available.
  }

  if (
    typeof product.rating === "number" &&
    typeof product.ratingCount === "number"
  ) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.ratingCount,
    }; // Attach rating summary when available.
  }

  schema.offers = {
    "@type": "Offer",
    priceCurrency: "USD",
    price: product.price.toFixed(2),
    availability: "https://schema.org/InStock",
    url: canonicalUrl,
  }; // Attach pricing + availability data.

  return schema;
};

export const dynamicParams = false; // Pre-render all product routes for static export.

/**
 * Generate static params for all product slugs.
 */
export async function generateStaticParams() {
  const products = await fetchProducts(); // Load product slugs for static export.
  return products.map((product) => ({ slug: product.slug }));
}


/**
 * Generate metadata for product detail pages.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params; // Support async params when applicable.
  const slug = decodeURIComponent(resolvedParams.slug); // Normalize slug input.
  const product = await fetchProductBySlug(slug); // Load product by slug.

  if (!product) {
    notFound(); // Surface 404 when product is missing.
  }

  const description = buildMetaDescription(product.description); // Trim description for meta.
  const canonicalUrl = `${SITE_URL}/product/${product.slug}`; // Build canonical URL.
  const ogImage = product.images[0] ?? "/window.svg"; // Pick first image or fallback.

  return {
    title: product.name,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: product.name,
      description,
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: ogImage,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Full product page for direct visits and SEO rendering.
 */
export default async function ProductPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolvedParams = await params; // Support async params when applicable.
  const slug = decodeURIComponent(resolvedParams.slug); // Normalize slug input.
  const product = await fetchProductBySlug(slug); // Load product by slug.

  if (!product) {
    notFound(); // Surface 404 when product is missing.
  }

  const schemaData = buildProductSchema(product); // Build JSON-LD schema data.
  const schemaMarkup = JSON.stringify(schemaData); // Serialize schema for script injection.

  return (
    <>
      {/* JSON-LD schema for search engines. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaMarkup }}
      />
      <ProductDetail product={product} />
    </>
  );
}
