import { notFound } from "next/navigation";
import ProductDetail from "@/components/product-detail/ProductDetail";
import { fetchProductBySlug } from "@/lib/data";

/**
 * Full product page for direct visits and SEO rendering.
 */
export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await fetchProductBySlug(params.slug); // Load product by slug.

  if (!product) {
    notFound(); // Surface 404 when product is missing.
  }

  return <ProductDetail product={product} />;
}
