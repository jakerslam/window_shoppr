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

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
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
