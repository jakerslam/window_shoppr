/**
 * Notification item shape for top bar menu rendering.
 */
export type NotificationItem = {
  id: string;
  title: string;
  summary: string;
  timeLabel: string;
  isRead: boolean;
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = []; // Keep empty state until backend notifications are wired.
