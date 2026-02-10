import Modal from "@/components/modal/Modal";
import ProductDetail from "@/components/product-detail/ProductDetail";
import { fetchProductBySlug } from "@/lib/data";

/**
 * Modal overlay for product details when navigating from the feed.
 */
export default async function ProductModal({
  params,
}: {
  params: { slug: string };
}) {
  const product = await fetchProductBySlug(params.slug); // Load product by slug.

  if (!product) {
    return null; // Skip modal when product is missing.
  }

  return (
    <Modal>
      <ProductDetail product={product} />
    </Modal>
  );
}
