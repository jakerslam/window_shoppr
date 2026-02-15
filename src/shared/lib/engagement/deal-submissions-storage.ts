"use client";

export type DealSubmissionStatus =
  | "pending"
  | "triaged"
  | "approved"
  | "rejected"
  | "needs_info";

export type DealSubmissionPayload = {
  url: string;
  title: string;
  category: string;
  subCategory?: string;
  salePrice?: number;
  listPrice?: number;
  couponCode?: string;
  store?: string;
  brand?: string;
  notes?: string;
  submitterEmail?: string;
  agreeIndependent: true;
  agreeAccuracy: true;
  submittedAt: string;
  source: "user_submission";
};

export type DealSubmissionQueueItem = {
  id: string;
  status: DealSubmissionStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  source: "user_submission";
  submission: DealSubmissionPayload;
};

const DEAL_SUBMISSION_STORAGE_KEY = "window_shoppr_deal_submissions"; // Local storage key for submission history.
const DEAL_SUBMISSION_QUEUE_KEY = "window_shoppr_deal_submission_queue"; // Local storage key for moderation queue items.
const MAX_HISTORY_ITEMS = 300; // Cap local submission history growth.
const MAX_QUEUE_ITEMS = 300; // Cap local queue growth.

export const DEAL_SUBMISSION_CREATED_EVENT = "submission:link:created"; // Emitted when a new link submission is queued.
export const DEAL_SUBMISSION_UPDATED_EVENT = "submission:link:resolved"; // Emitted when queue status changes.

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
 * Read local submission history for debugging and future account views.
 */
export const readDealSubmissionHistory = () => {
  if (typeof window === "undefined") {
    return [] as DealSubmissionPayload[]; // Skip storage reads during SSR.
  }

  return parseArray<DealSubmissionPayload>(
    window.localStorage.getItem(DEAL_SUBMISSION_STORAGE_KEY),
  );
};

/**
 * Read moderation queue entries for submitted links.
 */
export const readDealSubmissionQueue = () => {
  if (typeof window === "undefined") {
    return [] as DealSubmissionQueueItem[]; // Skip storage reads during SSR.
  }

  const items = parseArray<DealSubmissionQueueItem>(
    window.localStorage.getItem(DEAL_SUBMISSION_QUEUE_KEY),
  );
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

/**
 * Persist one submission payload and queue entry together.
 */
export const writeDealSubmissionRecord = ({
  submission,
  queueItem,
}: {
  submission: DealSubmissionPayload;
  queueItem: DealSubmissionQueueItem;
}) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  const history = readDealSubmissionHistory();
  window.localStorage.setItem(
    DEAL_SUBMISSION_STORAGE_KEY,
    JSON.stringify([...history, submission].slice(-MAX_HISTORY_ITEMS)),
  );

  const queue = readDealSubmissionQueue();
  window.localStorage.setItem(
    DEAL_SUBMISSION_QUEUE_KEY,
    JSON.stringify([...queue, queueItem].slice(-MAX_QUEUE_ITEMS)),
  );
};

/**
 * Return only pending deal submissions for the agent moderation pipeline.
 */
export const getPendingDealSubmissionQueue = () =>
  readDealSubmissionQueue().filter((item) => item.status === "pending");
