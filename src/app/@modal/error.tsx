"use client";

import Link from "next/link";
import Modal from "@/shared/components/modal/Modal";
import styles from "@/app/@modal/error.module.css";

/**
 * Modal error boundary for intercept routes.
 */
export default function ModalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const showDetails = process.env.NODE_ENV === "development"; // Only show details in dev.

  return (
    <Modal>
      <div className={styles.modalError}>
        {/* Modal error headline. */}
        <h2 className={styles.modalError__title}>We hit a snag.</h2>

        {/* Helper copy for recovery. */}
        <p className={styles.modalError__text}>
          Try again or head back to the feed.
        </p>

        {/* Recovery actions inside the modal. */}
        <div className={styles.modalError__actions}>
          <button
            className={styles.modalError__action}
            type="button"
            onClick={() => reset()} // Retry the modal content.
          >
            Try again
          </button>
          <Link className={styles.modalError__action} href="/">
            ← Back to feed
          </Link>
        </div>

        {/* Developer-only error details. */}
        {showDetails ? (
          <p className={styles.modalError__text}>{error.message}</p>
        ) : null}
      </div>
    </Modal>
  );
}
