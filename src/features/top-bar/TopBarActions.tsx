"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "@/features/top-bar/TopBar.module.css";
import { BellIcon } from "@/features/top-bar/NavIcons";

/**
 * Notification item shape for top bar menu rendering.
 */
type NotificationItem = {
  id: string;
  title: string;
  summary: string;
  timeLabel: string;
  isRead: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-001",
    title: "Price drop on saved item",
    summary: "Cozy Cloud Throw Blanket is now 12% lower.",
    timeLabel: "2h ago",
    isRead: false,
  },
  {
    id: "notif-002",
    title: "New trending pick",
    summary: "A top-rated desk fan was added to Tech finds.",
    timeLabel: "Yesterday",
    isRead: false,
  },
  {
    id: "notif-003",
    title: "Wishlist reminder",
    summary: "You have 5 saved products with active deals.",
    timeLabel: "2d ago",
    isRead: true,
  },
];

/**
 * Right-side action buttons for notifications and account shortcuts.
 */
export default function TopBarActions() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  ); // Compute unread badge count from local notification state.

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
   * Mark a single notification as read.
   */
  const handleNotificationRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    ); // Update one row to read while keeping the list order stable.
  };

  /**
   * Mark all notifications as read.
   */
  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true })),
    ); // Clear unread badge by setting every row to read.
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
          {unreadCount > 0 ? (
            <span className={styles.topBar__iconBadge} aria-hidden="true">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>

        {isNotificationsOpen ? (
          <div className={styles.topBar__notificationsMenu} role="menu" id={menuId}>
            <div className={styles.topBar__notificationsHeader}>
              <span>Notifications</span>
              {unreadCount > 0 ? (
                <button
                  className={styles.topBar__notificationsMarkRead}
                  type="button"
                  onClick={handleMarkAllRead} // Mark all visible notifications as read.
                >
                  Mark all read
                </button>
              ) : null}
            </div>

            {notifications.length === 0 ? (
              <p className={styles.topBar__notificationsEmpty}>No notifications</p>
            ) : (
              <div className={styles.topBar__notificationsList}>
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className={`${styles.topBar__notificationsItem} ${
                      notification.isRead
                        ? styles["topBar__notificationsItem--read"]
                        : styles["topBar__notificationsItem--unread"]
                    }`}
                    type="button"
                    role="menuitem"
                    onClick={() => handleNotificationRead(notification.id)} // Mark this notification as read.
                  >
                    <span className={styles.topBar__notificationsTitle}>{notification.title}</span>
                    <span className={styles.topBar__notificationsSummary}>{notification.summary}</span>
                    <span className={styles.topBar__notificationsMeta}>{notification.timeLabel}</span>
                  </button>
                ))}
              </div>
            )}

            <p className={styles.topBar__notificationsFooter}>Notification feed is in beta.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
