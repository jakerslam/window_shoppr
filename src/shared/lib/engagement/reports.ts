export type ReportReason = "inaccuracy" | "inappropriate" | "spam" | "other";
export type ReportStatus = "pending" | "triaged" | "resolved" | "dismissed";

export type ReportPayload = {
  productId: string;
  productSlug: string;
  reason: ReportReason;
  details?: string;
  timestamp: string;
};

export type ModerationQueueItem = {
  id: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  source: "user_report";
  report: ReportPayload;
};

const REPORT_STORAGE_KEY = "window_shoppr_reports"; // Local storage key for raw report history.
const REPORT_QUEUE_STORAGE_KEY = "window_shoppr_report_queue"; // Local storage key for moderation queue entries.
const MAX_REPORT_HISTORY = 200; // Cap report history growth in local storage.
const MAX_QUEUE_ITEMS = 400; // Cap moderation queue growth in local storage.

/**
 * Parse a local storage value into an array fallback.
 */
const parseArray = <T>(raw: string | null): T[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

/**
 * Build a stable local-first moderation queue id.
 */
const createReportQueueId = () =>
  `rep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Read the moderation queue snapshot for agent tooling.
 */
export const readModerationQueue = () => {
  if (typeof window === "undefined") {
    return [] as ModerationQueueItem[]; // Skip storage access during SSR.
  }

  const items = parseArray<ModerationQueueItem>(
    window.localStorage.getItem(REPORT_QUEUE_STORAGE_KEY),
  );
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

/**
 * Return only pending report items for agent review.
 */
export const getPendingModerationQueue = () =>
  readModerationQueue().filter((item) => item.status === "pending");

/**
 * Update a moderation queue item status with optional reviewer notes.
 */
export const updateModerationQueueItem = ({
  id,
  status,
  reviewedBy,
  reviewNotes,
}: {
  id: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewNotes?: string;
}) => {
  if (typeof window === "undefined") {
    return null; // Skip storage access during SSR.
  }

  const queue = parseArray<ModerationQueueItem>(
    window.localStorage.getItem(REPORT_QUEUE_STORAGE_KEY),
  );
  const now = new Date().toISOString();
  let updatedItem: ModerationQueueItem | null = null;

  const nextQueue = queue.map((item) => {
    if (item.id !== id) {
      return item;
    }

    const nextItem: ModerationQueueItem = {
      ...item,
      status,
      updatedAt: now,
      reviewedAt: status === "pending" ? undefined : now,
      reviewedBy: reviewedBy?.trim() || item.reviewedBy,
      reviewNotes: reviewNotes?.trim() || item.reviewNotes,
    };
    updatedItem = nextItem;
    return nextItem;
  });

  if (!updatedItem) {
    return null; // Ignore updates for unknown queue ids.
  }

  window.localStorage.setItem(
    REPORT_QUEUE_STORAGE_KEY,
    JSON.stringify(nextQueue.slice(-MAX_QUEUE_ITEMS)),
  );
  window.dispatchEvent(
    new CustomEvent("moderation:queue:update", { detail: updatedItem }),
  ); // Broadcast queue updates for future agent bridge wiring.

  return updatedItem;
};

/**
 * Persist a user report and enqueue it for moderation review.
 */
export const submitReport = (payload: Omit<ReportPayload, "timestamp">) => {
  if (typeof window === "undefined") {
    return null; // Skip storage access during SSR.
  }

  const report: ReportPayload = {
    ...payload,
    details: payload.details?.trim() || undefined,
    timestamp: new Date().toISOString(),
  };
  const queueItem: ModerationQueueItem = {
    id: createReportQueueId(),
    status: "pending",
    createdAt: report.timestamp,
    updatedAt: report.timestamp,
    source: "user_report",
    report,
  };

  try {
    const reportHistory = parseArray<ReportPayload>(
      window.localStorage.getItem(REPORT_STORAGE_KEY),
    );
    window.localStorage.setItem(
      REPORT_STORAGE_KEY,
      JSON.stringify([...reportHistory, report].slice(-MAX_REPORT_HISTORY)),
    );

    const queue = parseArray<ModerationQueueItem>(
      window.localStorage.getItem(REPORT_QUEUE_STORAGE_KEY),
    );
    window.localStorage.setItem(
      REPORT_QUEUE_STORAGE_KEY,
      JSON.stringify([...queue, queueItem].slice(-MAX_QUEUE_ITEMS)),
    );
  } catch {
    // Ignore storage failures to avoid blocking reporting flow.
  }

  window.dispatchEvent(new CustomEvent("report:submit", { detail: report }));
  window.dispatchEvent(
    new CustomEvent("moderation:queue:enqueue", { detail: queueItem }),
  ); // Broadcast new queue work for future agent ingestion.

  return queueItem;
};

/**
 * Stub export for future agent polling endpoints.
 */
export const buildModerationQueueSnapshot = () => ({
  generatedAt: new Date().toISOString(),
  pendingCount: getPendingModerationQueue().length,
  items: getPendingModerationQueue(),
});
