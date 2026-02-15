"use client";

import { useEffect } from "react";

/**
 * Modal lifecycle wiring for the taste quiz (scroll lock + escape close + feed pause events).
 */
export default function useTasteQuizModalLifecycle({
  isOpen,
  onReset,
  onClose,
}: {
  isOpen: boolean;
  onReset: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined; // Skip wiring while closed.
    }

    const timeoutId = window.setTimeout(() => {
      onReset(); // Reset quiz state when opening.
    }, 0); // Defer state updates to avoid cascading render warnings.

    document.body.style.overflow = "hidden"; // Prevent background scroll while open.
    window.dispatchEvent(new CustomEvent("modal:toggle", { detail: { open: true } })); // Pause feed while open.

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose(); // Allow keyboard users to exit the quiz.
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timeoutId); // Clean up deferred reset when closing quickly.
      document.body.style.overflow = ""; // Restore background scroll.
      window.dispatchEvent(new CustomEvent("modal:toggle", { detail: { open: false } })); // Resume feed.
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, onReset]);
}

