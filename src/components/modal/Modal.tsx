"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/modal/Modal.module.css";

/**
 * Modal shell that overlays content above the page.
 */
export default function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Close the modal by navigating back in history.
  const handleClose = useCallback(() => {
    router.back(); // Return to the previous route to dismiss the modal.
  }, [router]);

  // Wire escape key handling and lock background scroll.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose(); // Close on escape for keyboard users.
      }
    };

    document.documentElement.style.overflow = "hidden"; // Lock html scrolling for modals.
    document.body.style.overflow = "hidden"; // Prevent background scroll while open.
    window.addEventListener("keydown", handleKeyDown); // Listen for escape key events.

    return () => {
      document.documentElement.style.overflow = ""; // Restore html scroll after closing.
      document.body.style.overflow = ""; // Restore scroll after closing.
      window.removeEventListener("keydown", handleKeyDown); // Clean up escape handler.
    };
  }, [handleClose]);

  return (
    <div className={styles.modal} role="dialog" aria-modal="true">
      {/* Backdrop layer for focus and separation. */}
      <div
        className={styles.modal__backdrop}
        onClick={handleClose} // Close modal when clicking outside content.
      />

      {/* Content container for modal body. */}
      <div className={styles.modal__content}>
        {/* Modal body content. */}
        {children}
      </div>
    </div>
  );
}
