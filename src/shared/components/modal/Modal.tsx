"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "@/shared/components/modal/Modal.module.css";

/**
 * Modal shell that overlays content above the page.
 */
export default function Modal({
  children,
  contentClassName,
  contentStyle,
  variant = "default",
}: {
  children: React.ReactNode;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  variant?: "default" | "desktop-fullheight";
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Close the modal by navigating back in history.
  const handleClose = useCallback(() => {
    router.back(); // Return to the previous route to dismiss the modal.

    if (typeof window === "undefined") {
      return; // Skip secondary close when not in the browser.
    }

    if (pathname === "/login" || pathname === "/signup") {
      window.setTimeout(() => {
        if (window.location.pathname === "/login" || window.location.pathname === "/signup") {
          router.back(); // Ensure modal closes when switching between auth routes.
        }
      }, 0);
    }
  }, [pathname, router]);

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
    window.dispatchEvent(new CustomEvent("modal:toggle", { detail: { open: true } })); // Pause feed when modal opens.

    return () => {
      document.documentElement.style.overflow = ""; // Restore html scroll after closing.
      document.body.style.overflow = ""; // Restore scroll after closing.
      window.removeEventListener("keydown", handleKeyDown); // Clean up escape handler.
      window.dispatchEvent(new CustomEvent("modal:toggle", { detail: { open: false } })); // Resume feed after modal closes.
    };
  }, [handleClose]);

  return (
    <div
      className={`${styles.modal} ${variant === "desktop-fullheight" ? styles["modal--desktopFullHeight"] : ""}`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop layer for focus and separation. */}
      <div
        className={styles.modal__backdrop}
        onClick={handleClose} // Close modal when clicking outside content.
      />

      {/* Content container for modal body. */}
      <div
        className={`${styles.modal__content} ${contentClassName ?? ""}`}
        style={contentStyle} // Optional inline overrides for sizing.
      >
        {/* Close button for explicit dismissal. */}
        <button
          className={styles.modal__close}
          type="button"
          aria-label="Close modal"
          onClick={handleClose} // Close modal on button click.
        >
          ×
        </button>

        {/* Modal body content. */}
        {children}
      </div>
    </div>
  );
}
