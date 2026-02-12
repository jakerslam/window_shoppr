"use client";

import { useEffect, useState } from "react";
import styles from "@/shared/components/privacy/CookieConsent.module.css";

const CONSENT_KEY = "window_shoppr_cookie_consent"; // Local storage key for consent.

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
    setIsVisible(!stored); // Show banner until consent is stored.
  }, []);

  const handleAccept = () => {
    window.localStorage.setItem(CONSENT_KEY, new Date().toISOString());
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
        <button
          className={styles.cookieConsent__button}
          type="button"
          onClick={handleAccept}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
