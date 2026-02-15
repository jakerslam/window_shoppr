"use client";

import { useEffect, useMemo, useState } from "react";
import { submitEmailCapture } from "@/shared/lib/engagement/email";
import styles from "@/features/email-capture/EmailCaptureModal.module.css";

const DISMISSED_KEY = "windowShopprEmailDismissed"; // Local storage key for dismissal.
const SUBMITTED_KEY = "windowShopprEmailSubmitted"; // Local storage key for completion.
const OPEN_DELAY_MS = 6000; // Delay before showing the popup.

/**
 * Email capture popup with delayed display and local storage persistence.
 */
export default function EmailCaptureModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isDisabled = status === "submitting"; // Lock controls while submitting.
  const isSuccess = status === "success"; // Track success state for messaging.
  const emailRegex = useMemo(() => /\S+@\S+\.\S+/, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return; // Skip client-only effects during SSR.
    }

    const wasDismissed = window.localStorage.getItem(DISMISSED_KEY) === "true";
    const wasSubmitted = window.localStorage.getItem(SUBMITTED_KEY) === "true";

    if (wasDismissed || wasSubmitted) {
      return; // Respect prior dismissal or submission.
    }

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (scrollHeight > 0 && scrollTop / scrollHeight > 0.3) {
        setIsOpen(true); // Open after user scrolls a bit.
        window.removeEventListener("scroll", handleScroll);
        clearTimeout(timerId);
      }
    };

    const timerId = window.setTimeout(() => {
      setIsOpen(true); // Open after delay if not already shown.
      window.removeEventListener("scroll", handleScroll);
    }, OPEN_DELAY_MS);

    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(timerId); // Clean up timer on unmount.
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return; // Skip client-only effects during SSR.
    }

    if (isOpen) {
      document.body.style.overflow = "hidden"; // Prevent background scroll while open.
    } else {
      document.body.style.overflow = ""; // Restore scroll when closed.
    }
  }, [isOpen]);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISSED_KEY, "true"); // Remember dismissal.
    }

    setIsOpen(false); // Close the modal.
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submit.
    setErrorMessage(""); // Clear any prior errors.

    if (!emailRegex.test(email)) {
      setStatus("error"); // Flag invalid email input.
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("submitting"); // Lock UI while sending.

    try {
      const result = await submitEmailCapture(email); // Call stub submission handler.

      if (result.ok) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(SUBMITTED_KEY, "true"); // Remember success.
        }

        setStatus("success"); // Show success state.
        setTimeout(() => setIsOpen(false), 1200); // Auto-close after success.
        return;
      }

      throw new Error(result.message ?? "Submission failed");
    } catch (error) {
      console.warn("Email capture failed", error); // Log submission errors.
      setStatus("error");
      setErrorMessage("We could not save your email. Try again.");
    }
  };

  if (!isOpen) {
    return null; // Render nothing when closed.
  }

  return (
    <div className={styles.emailCapture} role="dialog" aria-modal="true">
      {/* Backdrop for modal focus. */}
      <div className={styles.emailCapture__backdrop} />

      {/* Modal card for the email form. */}
      <div className={styles.emailCapture__card}>
        {/* Headline and supporting text. */}
        <div className={styles.emailCapture__header}>
          <h2 className={styles.emailCapture__title}>Stay in the window</h2>
          <p className={styles.emailCapture__subtitle}>
            Get cozy drops, fresh deals, and trend finds in your inbox.
          </p>
        </div>

        {/* Email capture form. */}
        <form className={styles.emailCapture__form} onSubmit={handleSubmit}>
          <label className={styles.emailCapture__label}>
            Email address
            <input
              className={styles.emailCapture__input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              disabled={isDisabled || isSuccess}
            />
          </label>

          {/* Inline status messaging. */}
          {errorMessage ? (
            <div className={styles.emailCapture__error}>{errorMessage}</div>
          ) : null}

          {isSuccess ? (
            <div className={styles.emailCapture__success}>
              You&apos;re in! Watch for the next window drop.
            </div>
          ) : null}

          <button
            className={styles.emailCapture__submit}
            type="submit"
            disabled={isDisabled || isSuccess}
          >
            {isSuccess ? "Saved" : "Get the next drop"}
          </button>

          <button
            className={styles.emailCapture__skip}
            type="button"
            onClick={handleClose}
            disabled={isDisabled}
          >
            Not right now
          </button>
        </form>
      </div>
    </div>
  );
}
