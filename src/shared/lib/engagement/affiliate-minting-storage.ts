"use client";

export type AffiliateMintStatus =
  | "pending_agent"
  | "minted"
  | "failed"
  | "rolled_back";

export type AffiliateMintAuditAction =
  | "queued"
  | "auto_mint_attempted"
  | "agent_queue_required"
  | "compliance_failed"
  | "minted"
  | "replacement_applied"
  | "rollback_applied";

export type AffiliateMintAuditEntry = {
  at: string;
  action: AffiliateMintAuditAction;
  actor: "system_auto" | "agent" | "manual";
  note?: string;
};

export type AffiliateMintQueueItem = {
  id: string;
  submissionQueueId: string;
  source: "deal_submission";
  merchantUrl: string;
  activeListingUrl: string;
  mintedAffiliateUrl?: string;
  networkHint?: "amazon_associates" | "manual_agent";
  status: AffiliateMintStatus;
  complianceIssues?: string[];
  createdAt: string;
  updatedAt: string;
  auditTrail: AffiliateMintAuditEntry[];
};

const AFFILIATE_MINT_QUEUE_KEY = "window_shoppr_affiliate_mint_queue"; // Storage key for affiliate minting jobs.
const AFFILIATE_LINK_OVERRIDE_KEY = "window_shoppr_affiliate_link_overrides"; // Storage key for active affiliate URL replacements.
const MAX_QUEUE_ITEMS = 400; // Cap queue growth for local-first mode.

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
 * Parse an object map from local storage.
 */
const parseRecord = (raw: string | null) => {
  if (!raw) {
    return {} as Record<string, string>;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : ({} as Record<string, string>);
  } catch {
    return {} as Record<string, string>;
  }
};

/**
 * Read affiliate mint queue entries for agent processing.
 */
export const readAffiliateMintQueue = () => {
  if (typeof window === "undefined") {
    return [] as AffiliateMintQueueItem[]; // Skip storage access during SSR.
  }

  const items = parseArray<AffiliateMintQueueItem>(
    window.localStorage.getItem(AFFILIATE_MINT_QUEUE_KEY),
  );
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

/**
 * Persist affiliate mint queue entries.
 */
export const writeAffiliateMintQueue = (items: AffiliateMintQueueItem[]) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  window.localStorage.setItem(
    AFFILIATE_MINT_QUEUE_KEY,
    JSON.stringify(items.slice(-MAX_QUEUE_ITEMS)),
  );
};

/**
 * Read active affiliate-link overrides keyed by submission queue id.
 */
export const readAffiliateLinkOverrides = () => {
  if (typeof window === "undefined") {
    return {} as Record<string, string>; // Skip storage reads during SSR.
  }

  return parseRecord(window.localStorage.getItem(AFFILIATE_LINK_OVERRIDE_KEY));
};

/**
 * Persist affiliate-link overrides keyed by submission queue id.
 */
export const writeAffiliateLinkOverrides = (overrides: Record<string, string>) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  window.localStorage.setItem(
    AFFILIATE_LINK_OVERRIDE_KEY,
    JSON.stringify(overrides),
  );
};

/**
 * Resolve only pending mint jobs for agent action.
 */
export const getPendingAffiliateMintQueue = () =>
  readAffiliateMintQueue().filter((item) => item.status === "pending_agent");
