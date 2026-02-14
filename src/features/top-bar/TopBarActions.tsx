"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import styles from "@/features/top-bar/TopBar.module.css";
import { BellIcon } from "@/features/top-bar/NavIcons";

/**
 * Right-side action buttons for notifications and account shortcuts.
 */
export default function TopBarActions() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const notifications: string[] = []; // Placeholder data until backend notifications are wired.

  /**
   * Toggle the notifications dropdown from the bell button.
   */
  const handleNotificationsToggle = () => {
    setIsNotificationsOpen((prev) => !prev); // Toggle dropdown visibility.
  };

  /**
   * Close the notifications dropdown.
   */
  const handleNotificationsClose = () => {
    setIsNotificationsOpen(false); // Hide dropdown when dismissed.
  };

  /**
   * Close notifications when pressing escape or clicking away.
   */
  useEffect(() => {
    if (!isNotificationsOpen) {
      return undefined; // Skip listener wiring while dropdown is closed.
    }

    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        handleNotificationsClose(); // Close when interacting outside the bell region.
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleNotificationsClose(); // Close on keyboard escape.
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationsOpen]);

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

      {/* Notifications bell and dropdown menu. */}
      <div className={styles.topBar__notifications} ref={notificationsRef}>
        <button
          className={styles.topBar__iconButton}
          type="button"
          onClick={handleNotificationsToggle} // Toggle notifications dropdown.
          aria-label="Notifications"
          aria-haspopup="menu"
          aria-expanded={isNotificationsOpen}
          aria-controls={menuId}
        >
          <BellIcon className={styles.topBar__iconGraphic} />
        </button>

        {isNotificationsOpen ? (
          <div className={styles.topBar__notificationsMenu} role="menu" id={menuId}>
            {notifications.length === 0 ? (
              <p className={styles.topBar__notificationsEmpty}>No notifications</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification}
                  className={styles.topBar__notificationsItem}
                  type="button"
                  role="menuitem"
                  onClick={handleNotificationsClose} // Close after selecting an item.
                >
                  {notification}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
