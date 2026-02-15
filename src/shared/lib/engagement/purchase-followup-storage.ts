"use client";

export type PurchaseFollowupIntent = "bought" | "not_now" | "later";

export type PurchaseFollowupItem = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  retailer?: string;
  affiliateUrl: string;
  clickedAt: string;
  nextPromptAt: string;
  attempts: number;
  status: "pending" | "resolved";
};

export type PurchaseIntentRecord = {
  id: string;
  productId: string;
  productSlug: string;
  intent: Exclude<PurchaseFollowupIntent, "later">;
  answeredAt: string;
};

const FOLLOWUP_QUEUE_STORAGE_KEY = "window_shoppr_purchase_followups"; // Local queue key for pending post-click prompts.
const PURCHASE_INTENT_QUEUE_STORAGE_KEY = "window_shoppr_purchase_intents"; // Local queue key for unresolved SQL intent submissions.
const REVIEW_REMINDER_STORAGE_KEY = "window_shoppr_review_reminders"; // Local queue key for future review reminders.
const MAX_QUEUE_SIZE = 120; // Bound queue storage size.

export const PURCHASE_FOLLOWUP_EVENT = "purchase:followup:update"; // Broadcast when queue state changes.

/**
 * Read and parse JSON arrays from local storage safely.
 */
const readStorageArray = <T>(storageKey: string): T[] => {
  if (typeof window === "undefined") {
    return []; // Skip storage reads during SSR.
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return []; // Default to empty queue when no data exists.
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return []; // Ignore parse errors and treat as empty queue.
  }
};

/**
 * Persist bounded JSON arrays.
 */
const writeStorageArray = (storageKey: string, records: unknown[]) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(records.slice(-MAX_QUEUE_SIZE)),
    );
  } catch {
    // Ignore storage errors to avoid blocking primary user actions.
  }
};

/**
 * Emit local update events for follow-up consumers.
 */
export const broadcastFollowupUpdate = () => {
  if (typeof window === "undefined") {
    return; // Skip event dispatch during SSR.
  }

  window.dispatchEvent(new CustomEvent(PURCHASE_FOLLOWUP_EVENT));
};

/**
 * Read follow-up queue records.
 */
export const readFollowupQueue = () =>
  readStorageArray<PurchaseFollowupItem>(FOLLOWUP_QUEUE_STORAGE_KEY);

/**
 * Persist follow-up queue records.
 */
export const writeFollowupQueue = (records: PurchaseFollowupItem[]) =>
  writeStorageArray(FOLLOWUP_QUEUE_STORAGE_KEY, records);

/**
 * Read unresolved purchase-intent queue records.
 */
export const readPurchaseIntentQueue = () =>
  readStorageArray<PurchaseIntentRecord>(PURCHASE_INTENT_QUEUE_STORAGE_KEY);

/**
 * Persist unresolved purchase-intent queue records.
 */
export const writePurchaseIntentQueue = (records: PurchaseIntentRecord[]) =>
  writeStorageArray(PURCHASE_INTENT_QUEUE_STORAGE_KEY, records);

/**
 * Persist review reminder records.
 */
export const writeReviewReminderQueue = (
  records: Array<PurchaseIntentRecord & { remindAt: string }>,
) => writeStorageArray(REVIEW_REMINDER_STORAGE_KEY, records);

/**
 * Read review reminder records.
 */
export const readReviewReminderQueue = () =>
  readStorageArray<PurchaseIntentRecord & { remindAt: string }>(
    REVIEW_REMINDER_STORAGE_KEY,
  );
