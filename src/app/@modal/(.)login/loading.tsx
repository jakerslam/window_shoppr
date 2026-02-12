import Modal from "@/shared/components/modal/Modal";
import LoadingSpinner from "@/shared/components/loading/LoadingSpinner";
import styles from "@/app/@modal/(.)login/page.module.css";

/**
 * Modal loading fallback while login UI is streaming.
 */
export default function Loading() {
  return (
    <Modal
      contentClassName={styles.loginModal}
      contentStyle={{ width: "min(420px, 92vw)" }}
    >
      {/* Centered spinner inside the modal shell. */}
      <div style={{ minHeight: 240, display: "grid", placeItems: "center" }}>
        <LoadingSpinner label="Loading login…" />
      </div>
    </Modal>
  );
}
