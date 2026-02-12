import Modal from "@/shared/components/modal/Modal";
import LoadingSpinner from "@/shared/components/loading/LoadingSpinner";
import styles from "@/app/@modal/(.)product/[slug]/page.module.css";

/**
 * Modal loading fallback while product details are streaming.
 */
export default function Loading() {
  return (
    <Modal contentClassName={styles.productModal}>
      {/* Centered spinner inside the modal shell. */}
      <div style={{ minHeight: 240, display: "grid", placeItems: "center" }}>
        <LoadingSpinner label="Loading product…" />
      </div>
    </Modal>
  );
}
