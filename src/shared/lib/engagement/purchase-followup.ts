"use client";

import { requestDataApi } from "@/shared/lib/platform/data-api";
import {
  PurchaseFollowupIntent,
  PurchaseIntentRecord,
  PURCHASE_FOLLOWUP_EVENT,
  broadcastFollowupUpdate,
  readFollowupQueue,
  readPurchaseIntentQueue,
  readReviewReminderQueue,
  writeFollowupQueue,
  writePurchaseIntentQueue,
  writeReviewReminderQueue,
} from "@/shared/lib/engagement/purchase-followup-storage";

export { PURCHASE_FOLLOWUP_EVENT };

const INITIAL_PROMPT_DELAY_MS = 90_000; // Ask after users have time to evaluate purchase flow.
const LATER_PROMPT_DELAY_MS = 24 * 60 * 60 * 1000; // Ask-later delay window (24h).
const REVIEW_REMINDER_DELAY_MS = 3 * 24 * 60 * 60 * 1000; // Stub review reminder schedule (3 days).

/**
 * Queue a post-click follow-up prompt for a product affiliate click.
 */
export const queuePurchaseFollowup = (payload: {
  productId: string;
  productSlug: string;
  productName: string;
  retailer?: string;
  affiliateUrl: string;
}) => {
  const nowIso = new Date().toISOString();
  const queue = readFollowupQueue();
  const existing = queue.find(
    (entry) => entry.productId === payload.productId && entry.status === "pending",
  );

  if (existing) {
    const nextQueue = queue.map((entry) =>
      entry.id === existing.id
        ? {
            ...entry,
            clickedAt: nowIso,
            nextPromptAt: new Date(Date.now() + INITIAL_PROMPT_DELAY_MS).toISOString(),
            attempts: entry.attempts + 1,
          }
        : entry,
    ); // Refresh schedule when users click the same product again.
    writeFollowupQueue(nextQueue);
    broadcastFollowupUpdate();
    return;
  }

  writeFollowupQueue([
    ...queue,
    {
      id: `pfu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      productId: payload.productId,
      productSlug: payload.productSlug,
      productName: payload.productName,
      retailer: payload.retailer,
      affiliateUrl: payload.affiliateUrl,
      clickedAt: nowIso,
      nextPromptAt: new Date(Date.now() + INITIAL_PROMPT_DELAY_MS).toISOString(),
      attempts: 1,
      status: "pending" as const,
    },
  ]);
  broadcastFollowupUpdate();
};

/**
 * Read the next due pending follow-up item.
 */
export const readNextDuePurchaseFollowup = () => {
  const nowMs = Date.now();
  return (
    readFollowupQueue()
      .filter((entry) => entry.status === "pending")
      .sort(
        (a, b) =>
          new Date(a.nextPromptAt).getTime() - new Date(b.nextPromptAt).getTime(),
      )
      .find((entry) => new Date(entry.nextPromptAt).getTime() <= nowMs) ?? null
  ); // Select earliest due prompt.
};

/**
 * Defer a follow-up item for a later reminder window.
 */
export const postponePurchaseFollowup = (followupId: string) => {
  const nextQueue = readFollowupQueue().map((entry) =>
    entry.id === followupId
      ? {
          ...entry,
          nextPromptAt: new Date(Date.now() + LATER_PROMPT_DELAY_MS).toISOString(),
          attempts: entry.attempts + 1,
        }
      : entry,
  );
  writeFollowupQueue(nextQueue);
  broadcastFollowupUpdate();
};

/**
 * Submit purchase intent to SQL-backed API with local queue fallback.
 */
const submitPurchaseIntent = async (intentRecord: PurchaseIntentRecord) => {
  const response = await requestDataApi<{ id?: string }>({
    path: "/data/purchase-intents",
    method: "POST",
    body: intentRecord,
  }); // Attempt remote purchase-intent persistence.

  if (!response || !response.ok) {
    writePurchaseIntentQueue([...readPurchaseIntentQueue(), intentRecord]); // Queue unresolved purchase intents for later sync.
  }
};

/**
 * Queue a stub review-reminder record when users confirm purchase.
 */
const queueReviewReminder = (intentRecord: PurchaseIntentRecord) => {
  writeReviewReminderQueue([
    ...readReviewReminderQueue(),
    {
      ...intentRecord,
      remindAt: new Date(Date.now() + REVIEW_REMINDER_DELAY_MS).toISOString(),
    },
  ]); // Stub payload for future review-request email jobs.
};

/**
 * Resolve a follow-up answer and persist backend-ready intent signals.
 */
export const resolvePurchaseFollowup = async ({
  followupId,
  intent,
}: {
  followupId: string;
  intent: Exclude<PurchaseFollowupIntent, "later">;
}) => {
  const queue = readFollowupQueue();
  const target = queue.find((entry) => entry.id === followupId);
  if (!target) {
    return; // Ignore stale follow-up ids.
  }

  const intentRecord: PurchaseIntentRecord = {
    id: `pci_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    productId: target.productId,
    productSlug: target.productSlug,
    intent,
    answeredAt: new Date().toISOString(),
  };
  await submitPurchaseIntent(intentRecord); // Persist intent signal for analytics + CRM workflows.

  if (intent === "bought") {
    queueReviewReminder(intentRecord); // Queue review-reminder stub for confirmed purchases.
  }

  writeFollowupQueue(
    queue.map((entry) =>
      entry.id === followupId ? { ...entry, status: "resolved" } : entry,
    ),
  );
  broadcastFollowupUpdate();
};
