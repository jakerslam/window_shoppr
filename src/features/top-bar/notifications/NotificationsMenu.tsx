"use client";

import Link from "next/link";
import styles from "@/features/top-bar/TopBar.module.css";
import { NotificationItem } from "@/features/top-bar/notifications/constants";

/**
 * Notifications dropdown content with auth-gated and empty-state handling.
 */
export default function NotificationsMenu({
  menuId,
  isAuthenticated,
  unreadCount,
  notifications,
  loginHref,
  onClose,
  onMarkAllRead,
  onRead,
  onLoginClick,
}: {
  menuId: string;
  isAuthenticated: boolean;
  unreadCount: number;
  notifications: NotificationItem[];
  loginHref: string;
  onClose: () => void;
  onMarkAllRead: () => void;
  onRead: (id: string) => void;
  onLoginClick: () => void;
}) {
  return (
    <div className={styles.topBar__notificationsMenu} role="menu" id={menuId}>
      <div className={styles.topBar__notificationsHeader}>
        <span>Notifications</span>
        {isAuthenticated && unreadCount > 0 ? (
          <button
            className={styles.topBar__notificationsMarkRead}
            type="button"
            onClick={onMarkAllRead} // Mark all visible notifications as read.
          >
            Mark all read
          </button>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <div className={styles.topBar__notificationsAuthGate}>
          <p className={styles.topBar__notificationsEmpty}>Sign in to view notifications.</p>
          <Link
            className={styles.topBar__notificationsLogin}
            href={loginHref}
            role="menuitem"
            onClick={() => {
              onLoginClick(); // Preserve post-auth redirect before routing.
              onClose(); // Close dropdown while routing to auth.
            }}
          >
            Sign in
          </Link>
        </div>
      ) : notifications.length === 0 ? (
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
              onClick={() => onRead(notification.id)} // Mark this notification as read.
            >
              <span className={styles.topBar__notificationsTitle}>{notification.title}</span>
              <span className={styles.topBar__notificationsSummary}>{notification.summary}</span>
              <span className={styles.topBar__notificationsMeta}>{notification.timeLabel}</span>
            </button>
          ))}
        </div>
      )}

      {isAuthenticated ? (
        <p className={styles.topBar__notificationsFooter}>Notification feed is in beta.</p>
      ) : null}
    </div>
  );
}
