"use client";

import { requestDataApi } from "@/shared/lib/platform/data-api";
import { consumeRateLimit } from "@/shared/lib/platform/rate-limit";
import {
  sanitizeUserText,
  validateEmailInput,
} from "@/shared/lib/platform/input-hardening";
import { queueAffiliateMintForSubmission } from "@/shared/lib/engagement/affiliate-minting";
import {
  DEAL_SUBMISSION_CREATED_EVENT,
  DealSubmissionPayload,
  DealSubmissionQueueItem,
  getPendingDealSubmissionQueue,
  writeDealSubmissionRecord,
} from "@/shared/lib/engagement/deal-submissions-storage";
import { awardWindowPoints } from "@/shared/lib/engagement/window-points";

/**
 * Normalize URL inputs and reject unsafe/non-http URLs.
 */
const normalizeSubmissionUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    parsed.hash = "";
    return parsed.toString(); // Remove fragment noise for dedupe.
  } catch {
    return null;
  }
};

/**
 * Build a stable queue id for local-first moderation.
 */
const createDealSubmissionId = () =>
  `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Submit a new deal link to SQL API and local moderation queue.
 */
export const submitDealSubmission = async (input: {
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
  agreeIndependent: boolean;
  agreeAccuracy: boolean;
}) => {
  const rateLimitResult = consumeRateLimit({
    action: "deal_submission_write",
    windowMs: 1000 * 60 * 10,
    maxRequests: 6,
    cooldownMs: 1000 * 60 * 3,
    idempotencyKey: `${input.url.trim().toLowerCase()}::${input.title.trim().toLowerCase()}`,
  });
  if (!rateLimitResult.ok) {
    return {
      ok: false,
      statusCode: rateLimitResult.statusCode,
      message: rateLimitResult.message,
      retryAfterMs: rateLimitResult.retryAfterMs,
    } as const;
  }

  const normalizedUrl = normalizeSubmissionUrl(input.url);
  if (!normalizedUrl) {
    return { ok: false, message: "Please enter a valid product URL." } as const;
  }

  const safeTitle = sanitizeUserText(input.title, 120);
  const safeCategory = sanitizeUserText(input.category, 80);
  const safeSubCategory = input.subCategory
    ? sanitizeUserText(input.subCategory, 80)
    : undefined;
  const safeCouponCode = input.couponCode
    ? sanitizeUserText(input.couponCode, 60)
    : undefined;
  const safeStore = input.store ? sanitizeUserText(input.store, 80) : undefined;
  const safeBrand = input.brand ? sanitizeUserText(input.brand, 80) : undefined;
  const safeNotes = input.notes ? sanitizeUserText(input.notes, 1200) : undefined;
  const safeSubmitterEmail = input.submitterEmail
    ? sanitizeUserText(input.submitterEmail.toLowerCase(), 160)
    : undefined;

  if (!safeTitle) {
    return { ok: false, message: "Please add a deal title." } as const;
  }

  if (!safeCategory) {
    return { ok: false, message: "Please choose a category." } as const;
  }

  if (safeSubmitterEmail && !validateEmailInput(safeSubmitterEmail).success) {
    return { ok: false, message: "Please use a valid email address." } as const;
  }

  if (!input.agreeIndependent || !input.agreeAccuracy) {
    return {
      ok: false,
      message: "Please confirm both submission checkboxes.",
    } as const;
  }

  if (
    typeof input.salePrice === "number" &&
    typeof input.listPrice === "number" &&
    input.listPrice < input.salePrice
  ) {
    return {
      ok: false,
      message: "List price must be greater than or equal to sale price.",
    } as const;
  }

  const submittedAt = new Date().toISOString();
  const submission: DealSubmissionPayload = {
    url: normalizedUrl,
    title: safeTitle,
    category: safeCategory,
    subCategory: safeSubCategory || undefined,
    salePrice: input.salePrice,
    listPrice: input.listPrice,
    couponCode: safeCouponCode || undefined,
    store: safeStore || undefined,
    brand: safeBrand || undefined,
    notes: safeNotes || undefined,
    submitterEmail: safeSubmitterEmail || undefined,
    agreeIndependent: true,
    agreeAccuracy: true,
    submittedAt,
    source: "user_submission",
  };
  const queueItem: DealSubmissionQueueItem = {
    id: createDealSubmissionId(),
    status: "pending",
    createdAt: submittedAt,
    updatedAt: submittedAt,
    source: "user_submission",
    submission,
  };

  writeDealSubmissionRecord({ submission, queueItem }); // Persist local-first history and moderation queue.
  const affiliateMintResult = await queueAffiliateMintForSubmission({
    submissionQueueId: queueItem.id,
    merchantUrl: normalizedUrl,
  }); // Auto-attempt affiliate minting and queue unresolved jobs for agent action.

  const response = await requestDataApi<{ id?: string }>({
    path: "/data/submissions/link",
    method: "POST",
    body: {
      queueItem,
    },
  }); // Attempt SQL/API persistence for server-side moderation workflows.

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(DEAL_SUBMISSION_CREATED_EVENT, { detail: queueItem }),
    );
    window.dispatchEvent(
      new CustomEvent("moderation:queue:enqueue", { detail: queueItem }),
    ); // Reuse moderation enqueue signal for agent listeners.
  }

  awardWindowPoints({
    action: "deal_submission",
    uniqueKey: `deal-submission:${queueItem.id}`,
  }); // Reward users for contributing new deal submissions.

  if (!response || !response.ok) {
    return {
      ok: true,
      mode: "queued_local",
      id: queueItem.id,
      affiliateMintMode: affiliateMintResult.ok ? affiliateMintResult.mode : "failed",
    } as const;
  }

  return {
    ok: true,
    mode: "sql",
    id: response.data.id ?? queueItem.id,
    affiliateMintMode: affiliateMintResult.ok ? affiliateMintResult.mode : "failed",
  } as const;
};

/**
 * Build a pending submissions snapshot for future agent polling endpoints.
 */
export const buildDealSubmissionQueueSnapshot = () => ({
  generatedAt: new Date().toISOString(),
  pendingCount: getPendingDealSubmissionQueue().length,
  items: getPendingDealSubmissionQueue(),
});
