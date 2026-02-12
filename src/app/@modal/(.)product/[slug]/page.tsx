import Modal from "@/shared/components/modal/Modal";
import ProductDetail from "@/features/product-detail/ProductDetail";
import { fetchProductBySlug } from "@/shared/lib/data";
import styles from "@/app/@modal/(.)product/[slug]/page.module.css";

/**
 * Modal overlay for product details when navigating from the feed.
 */
export default async function ProductModal({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolvedParams = await params; // Support async params when applicable.
  const slug = decodeURIComponent(resolvedParams.slug); // Normalize slug input.
  const product = await fetchProductBySlug(slug); // Load product by slug.

  if (!product) {
    return null; // Skip modal when product is missing.
  }

  return (
    <Modal contentClassName={styles.productModal}>
      {/* Product details with modal-aware back button. */}
      <ProductDetail product={product} inModal />
    </Modal>
  );
}
