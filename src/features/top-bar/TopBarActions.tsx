"use client";

import Link from "next/link";
import styles from "@/features/top-bar/TopBar.module.css";
import { BellIcon } from "@/features/top-bar/NavIcons";

/**
 * Right-side action buttons for notifications and account shortcuts.
 */
export default function TopBarActions() {
  /**
   * Placeholder handler for future notifications panel.
   */
  const handleNotifications = () => {
    // TODO: Wire notifications panel when backend support is ready.
  };

  return (
    <div className={styles.topBar__actions}>
      {/* Desktop-only wishlist shortcut. */}
      <Link className={styles.topBar__actionButton} href="/wishlist">
        Wishlist
      </Link>

      {/* Desktop-only login shortcut. */}
      <Link className={styles.topBar__actionButton} href="/login">
        Login
      </Link>

      {/* Notifications bell for quick alerts. */}
      <button
        className={styles.topBar__iconButton}
        type="button"
        onClick={handleNotifications} // Stub for notifications behavior.
        aria-label="Notifications"
      >
        <BellIcon className={styles.topBar__iconGraphic} />
      </button>
    </div>
  );
}
