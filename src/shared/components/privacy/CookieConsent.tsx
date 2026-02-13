"use client";

import { useEffect, useState } from "react";
import styles from "@/shared/components/privacy/CookieConsent.module.css";

const CONSENT_KEY = "window_shoppr_cookie_consent"; // Local storage key for consent.
const CONSENT_MODE_KEY = "window_shoppr_cookie_mode"; // Stores consent choice.

const CONSENT_MODES = {
  all: "all",
  essential: "essential",
} as const;


/**
 * Cookie consent banner with disclosure and acknowledgment controls.
 */
export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return; // Skip during SSR.
    }

    const stored = window.localStorage.getItem(CONSENT_KEY);
    const timeoutId = window.setTimeout(() => {
      setIsVisible(!stored); // Show banner until consent is stored.
    }, 0);

    return () => {
      window.clearTimeout(timeoutId); // Clean up deferred visibility update.
    };
  }, []);

  const handleAcceptAll = () => {
    window.localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    window.localStorage.setItem(CONSENT_MODE_KEY, CONSENT_MODES.all);
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    window.localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    window.localStorage.setItem(CONSENT_MODE_KEY, CONSENT_MODES.essential);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null; // Skip rendering once consent is stored.
  }

  return (
    <div className={styles.cookieConsent} role="dialog" aria-live="polite">
      <div className={styles.cookieConsent__content}>
        <p className={styles.cookieConsent__title}>Privacy & affiliate notice</p>
        <p className={styles.cookieConsent__text}>
          We use cookies to remember preferences and measure engagement. Some
          links are affiliate links, which may earn us a commission at no extra
          cost to you.
        </p>
        <div className={styles.cookieConsent__actions}>
          <button
            className={`${styles.cookieConsent__button} ${styles["cookieConsent__button--primary"]}`}
            type="button"
            onClick={handleAcceptAll}
          >
            Accept all
          </button>
          <button
            className={styles.cookieConsent__button}
            type="button"
            onClick={handleEssentialOnly}
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}
