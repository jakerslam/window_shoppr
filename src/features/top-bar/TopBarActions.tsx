"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "@/features/top-bar/TopBar.module.css";
import { BellIcon } from "@/features/top-bar/NavIcons";
import { INITIAL_NOTIFICATIONS } from "@/features/top-bar/notifications/constants";
import NotificationsMenu from "@/features/top-bar/notifications/NotificationsMenu";
import { NotificationItem } from "@/features/top-bar/notifications/constants";
import { readWindowPointsState } from "@/shared/lib/engagement/window-points";
import { signOutAccount } from "@/shared/lib/platform/auth-service";
import {
  withAuthRedirectParam,
  writeAuthRedirectPath,
} from "@/shared/lib/platform/auth-redirect";
import useAuthSessionState from "@/shared/lib/platform/useAuthSessionState";

/**
 * Right-side action buttons for notifications and account shortcuts.
 */
export default function TopBarActions() {
  const pathname = usePathname();
  const session = useAuthSessionState();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS,
  );
  const [pointsTotal, setPointsTotal] = useState(() => readWindowPointsState().totalPoints);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  const unreadCount = useMemo(
    () =>
      session
        ? notifications.filter((notification) => !notification.isRead).length
        : 0,
    [notifications, session],
  ); // Compute unread badge count from local notification state.

  const currentPath = useMemo(() => pathname, [pathname]); // Capture route for post-auth return.
  const notificationsLoginHref = useMemo(
    () => withAuthRedirectParam("/login", currentPath),
    [currentPath],
  ); // Include a safe return target for notifications auth gate.

  const loginHref = useMemo(() => {
    if (session) {
      return "/login"; // Route signed-in users directly to profile settings.
    }

    return withAuthRedirectParam("/login", currentPath); // Include return target for signed-out users.
  }, [currentPath, session]);
  const loginLabel = useMemo(() => {
    if (!session) {
      return "Login";
    }

    return session.displayName?.trim() || "Account";
  }, [session]);
  const pointsLabel = useMemo(
    () => (pointsTotal > 9999 ? "9,999+" : pointsTotal.toLocaleString()),
    [pointsTotal],
  ); // Keep point-count text compact for the top bar badge.

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
    if (!session) {
      return; // Ignore notification mutations when signed out.
    }

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
    if (!session) {
      return; // Ignore notification mutations when signed out.
    }

    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true })),
    ); // Clear unread badge by setting every row to read.
  };

  /**
   * Sign out and return to the feed.
   */
  const handleSignOut = async () => {
    await signOutAccount(); // Clear local auth session and notify listeners.
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

  /**
   * Keep the top-bar points badge synced with reward updates across tabs/components.
   */
  useEffect(() => {
    const syncPoints = () => {
      setPointsTotal(readWindowPointsState().totalPoints); // Refresh point total from local storage.
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "window_shoppr_window_points") {
        syncPoints(); // Sync when another tab updates points.
      }
    };

    window.addEventListener("window-points:update", syncPoints);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("window-points:update", syncPoints);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <div className={styles.topBar__actions}>
      {/* Desktop-only submit-deal shortcut. */}
      <Link className={styles.topBar__actionButton} href="/submit-deal">
        Submit Deal
      </Link>

      {/* Desktop-only wishlist shortcut. */}
      <Link className={styles.topBar__actionButton} href="/wishlist">
        Wishlist
      </Link>

      {/* Desktop-only login shortcut. */}
      <Link
        className={styles.topBar__actionButton}
        href={loginHref}
        onClick={() => {
          if (!session) {
            writeAuthRedirectPath(currentPath); // Persist return target for signed-out users.
          }
        }}
      >
        {loginLabel}
      </Link>

      {session ? (
        <button
          className={styles.topBar__actionButton}
          type="button"
          onClick={handleSignOut} // Allow signed-in users to clear their session quickly.
        >
          Sign out
        </button>
      ) : null}

      <span className={styles.topBar__pointsBadge} aria-label={`Window points: ${pointsLabel}`}>
        {pointsLabel}
      </span>

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
          <NotificationsMenu
            menuId={menuId}
            isAuthenticated={Boolean(session)}
            unreadCount={unreadCount}
            notifications={notifications}
            loginHref={notificationsLoginHref}
            onClose={handleNotificationsClose}
            onMarkAllRead={handleMarkAllRead}
            onRead={handleNotificationRead}
            onLoginClick={() => writeAuthRedirectPath(currentPath)}
          />
        ) : null}
      </div>
    </div>
  );
}
