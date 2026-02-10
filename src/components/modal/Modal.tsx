import styles from "@/components/modal/Modal.module.css";

/**
 * Modal shell that overlays content above the page.
 */
export default function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.modal}>
      {/* Backdrop layer for focus and separation. */}
      <div className={styles.modal__backdrop} />

      {/* Content container for modal body. */}
      <div className={styles.modal__content}>{children}</div>
    </div>
  );
}
