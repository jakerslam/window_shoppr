"use client";

import { requestDataApi } from "@/shared/lib/platform/data-api";
import { PUBLIC_ENV } from "@/shared/lib/platform/env";
import {
  AffiliateMintAuditEntry,
  AffiliateMintQueueItem,
  getPendingAffiliateMintQueue,
  readAffiliateLinkOverrides,
  readAffiliateMintQueue,
  writeAffiliateLinkOverrides,
  writeAffiliateMintQueue,
} from "@/shared/lib/engagement/affiliate-minting-storage";

export const AFFILIATE_MINT_CREATED_EVENT = "affiliate:mint:queued"; // Broadcast when a new mint job is queued.
export const AFFILIATE_MINT_UPDATED_EVENT = "affiliate:mint:updated"; // Broadcast when a mint job updates state.

const KNOWN_AFFILIATE_HOST_HINTS = [
  "amazon.",
  "amzn.to",
  "linksynergy.com",
  "dpbolvw.net",
  "tkqlhce.com",
  "rstyle.me",
  "shop-links.co",
  "redirectingat.com",
]; // Host hints allowed for affiliate-replaced URLs in local compliance checks.

const BLOCKED_SIGNAL_HOST_HINTS = ["slickdeals.net"]; // Never treat source-signal URLs as final affiliate destinations.

/**
 * Normalize and validate a merchant product URL.
 */
const normalizeMerchantUrl = (value: string) => {
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
    return parsed.toString();
  } catch {
    return null;
  }
};

/**
 * Build a deterministic queue id for affiliate mint jobs.
 */
const createMintQueueId = () =>
  `amq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Build a single audit entry with consistent timestamp fields.
 */
const createAuditEntry = ({
  action,
  actor,
  note,
}: {
  action: AffiliateMintAuditEntry["action"];
  actor: AffiliateMintAuditEntry["actor"];
  note?: string;
}) => ({
  at: new Date().toISOString(),
  action,
  actor,
  note,
});

/**
 * Attempt automatic affiliate minting for Amazon URLs when tag config exists.
 */
const buildAutoAffiliateCandidate = (merchantUrl: string) => {
  const associateTag = PUBLIC_ENV.amazonAssociateTag.trim();
  if (!associateTag) {
    return null; // Auto-mint is disabled until an Associates tag is configured.
  }

  try {
    const parsed = new URL(merchantUrl);
    if (!parsed.hostname.toLowerCase().includes("amazon.")) {
      return null; // Currently auto-mint only supports Amazon links.
    }

    parsed.searchParams.set("tag", associateTag); // Inject/replace Associate tag.
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
};

/**
 * Validate minted affiliate URL before replacement is applied.
 */
const validateMintCompliance = ({
  merchantUrl,
  candidateUrl,
}: {
  merchantUrl: string;
  candidateUrl: string;
}) => {
  const issues: string[] = [];

  const merchant = normalizeMerchantUrl(merchantUrl);
  const candidate = normalizeMerchantUrl(candidateUrl);
  if (!merchant || !candidate) {
    return {
      ok: false,
      issues: ["Merchant/candidate URL must be valid http(s)."],
    };
  }

  const merchantHost = new URL(merchant).hostname.toLowerCase();
  const candidateHost = new URL(candidate).hostname.toLowerCase();
  const isBlocked = BLOCKED_SIGNAL_HOST_HINTS.some((hint) =>
    candidateHost.includes(hint),
  );
  if (isBlocked) {
    issues.push("Candidate URL points to a blocked signal host.");
  }

  const isSameDomain = candidateHost === merchantHost;
  const isKnownAffiliateHost = KNOWN_AFFILIATE_HOST_HINTS.some((hint) =>
    candidateHost.includes(hint),
  );
  if (!isSameDomain && !isKnownAffiliateHost) {
    issues.push("Candidate URL host is not recognized as merchant or affiliate-safe.");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
};

/**
 * Persist an updated mint queue item and emit update hooks.
 */
const updateMintQueueItem = (
  queueId: string,
  updater: (item: AffiliateMintQueueItem) => AffiliateMintQueueItem,
) => {
  const queue = readAffiliateMintQueue();
  let updated: AffiliateMintQueueItem | null = null;
  const nextQueue = queue.map((item) => {
    if (item.id !== queueId) {
      return item;
    }

    updated = updater(item);
    return updated;
  });

  if (!updated) {
    return null; // Skip unknown queue ids.
  }

  writeAffiliateMintQueue(nextQueue);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AFFILIATE_MINT_UPDATED_EVENT, { detail: updated }));
  }

  return updated;
};

/**
 * Queue affiliate minting work for a newly submitted deal URL.
 */
export const queueAffiliateMintForSubmission = async ({
  submissionQueueId,
  merchantUrl,
}: {
  submissionQueueId: string;
  merchantUrl: string;
}) => {
  const normalizedMerchantUrl = normalizeMerchantUrl(merchantUrl);
  if (!normalizedMerchantUrl) {
    return {
      ok: false,
      message: "Submission URL is not a valid merchant URL.",
    } as const;
  }

  const existing = readAffiliateMintQueue().find(
    (item) => item.submissionQueueId === submissionQueueId,
  );
  if (existing) {
    return {
      ok: true,
      mode: existing.status,
      queueItem: existing,
    } as const; // Keep queue idempotent for repeated submission events.
  }

  const createdAt = new Date().toISOString();
  const queueItem: AffiliateMintQueueItem = {
    id: createMintQueueId(),
    submissionQueueId,
    source: "deal_submission",
    merchantUrl: normalizedMerchantUrl,
    activeListingUrl: normalizedMerchantUrl,
    status: "pending_agent",
    networkHint: "manual_agent",
    createdAt,
    updatedAt: createdAt,
    auditTrail: [
      createAuditEntry({
        action: "queued",
        actor: "system_auto",
        note: "Affiliate minting job created from link submission.",
      }),
    ],
  };

  const autoCandidateUrl = buildAutoAffiliateCandidate(normalizedMerchantUrl);
  if (autoCandidateUrl) {
    const compliance = validateMintCompliance({
      merchantUrl: normalizedMerchantUrl,
      candidateUrl: autoCandidateUrl,
    });

    queueItem.auditTrail.push(
      createAuditEntry({
        action: "auto_mint_attempted",
        actor: "system_auto",
        note: "Attempted automatic first-party affiliate minting.",
      }),
    );

    if (compliance.ok) {
      queueItem.status = "minted";
      queueItem.networkHint = "amazon_associates";
      queueItem.mintedAffiliateUrl = autoCandidateUrl;
      queueItem.activeListingUrl = autoCandidateUrl;
      queueItem.updatedAt = new Date().toISOString();
      queueItem.auditTrail.push(
        createAuditEntry({
          action: "minted",
          actor: "system_auto",
          note: "Automatic minting succeeded.",
        }),
      );
      queueItem.auditTrail.push(
        createAuditEntry({
          action: "replacement_applied",
          actor: "system_auto",
          note: "Auto-replaced listing URL with minted affiliate URL.",
        }),
      );
    } else {
      queueItem.complianceIssues = compliance.issues;
      queueItem.auditTrail.push(
        createAuditEntry({
          action: "compliance_failed",
          actor: "system_auto",
          note: compliance.issues.join(" "),
        }),
      );
      queueItem.auditTrail.push(
        createAuditEntry({
          action: "agent_queue_required",
          actor: "system_auto",
          note: "Queued for agent minting due to compliance validation failure.",
        }),
      );
    }
  } else {
    queueItem.auditTrail.push(
      createAuditEntry({
        action: "agent_queue_required",
        actor: "system_auto",
        note: "No automatic minting route available; waiting for agent action.",
      }),
    );
  }

  const queue = readAffiliateMintQueue();
  writeAffiliateMintQueue([...queue, queueItem]);

  if (queueItem.status === "minted" && queueItem.mintedAffiliateUrl) {
    const overrides = readAffiliateLinkOverrides();
    writeAffiliateLinkOverrides({
      ...overrides,
      [submissionQueueId]: queueItem.mintedAffiliateUrl,
    }); // Persist active replacement mapping for minted submissions.
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AFFILIATE_MINT_CREATED_EVENT, { detail: queueItem }));
  }

  await requestDataApi({
    path: "/data/submissions/affiliate-mint",
    method: "POST",
    body: { queueItem },
  }); // Attempt SQL/API persistence; ignore failures in local-first mode.

  return {
    ok: true,
    mode: queueItem.status,
    queueItem,
  } as const;
};

/**
 * Apply an agent-generated affiliate URL to a queued minting job.
 */
export const applyAgentMintedAffiliateLink = ({
  queueId,
  mintedAffiliateUrl,
  actor,
  note,
}: {
  queueId: string;
  mintedAffiliateUrl: string;
  actor: string;
  note?: string;
}) => {
  return updateMintQueueItem(queueId, (item) => {
    const compliance = validateMintCompliance({
      merchantUrl: item.merchantUrl,
      candidateUrl: mintedAffiliateUrl,
    });

    if (!compliance.ok) {
      return {
        ...item,
        status: "failed",
        complianceIssues: compliance.issues,
        updatedAt: new Date().toISOString(),
        auditTrail: [
          ...item.auditTrail,
          createAuditEntry({
            action: "compliance_failed",
            actor: "agent",
            note:
              note ||
              `Agent-provided URL failed compliance: ${compliance.issues.join(" ")}`,
          }),
        ],
      };
    }

    const normalizedCandidate = normalizeMerchantUrl(mintedAffiliateUrl) ?? mintedAffiliateUrl;
    const overrides = readAffiliateLinkOverrides();
    writeAffiliateLinkOverrides({
      ...overrides,
      [item.submissionQueueId]: normalizedCandidate,
    }); // Auto-replace listing URL with approved minted link.

    return {
      ...item,
      status: "minted",
      networkHint: "manual_agent",
      mintedAffiliateUrl: normalizedCandidate,
      activeListingUrl: normalizedCandidate,
      complianceIssues: undefined,
      updatedAt: new Date().toISOString(),
      auditTrail: [
        ...item.auditTrail,
        createAuditEntry({
          action: "minted",
          actor: "agent",
          note: note || `Minted by ${actor}.`,
        }),
        createAuditEntry({
          action: "replacement_applied",
          actor: "agent",
          note: "Listing URL replaced with agent-minted affiliate URL.",
        }),
      ],
    };
  });
};

/**
 * Roll back an applied affiliate replacement to merchant URL.
 */
export const rollbackAffiliateReplacement = ({
  queueId,
  reason,
}: {
  queueId: string;
  reason: string;
}) => {
  return updateMintQueueItem(queueId, (item) => {
    const overrides = readAffiliateLinkOverrides();
    const nextOverrides = { ...overrides };
    delete nextOverrides[item.submissionQueueId];
    writeAffiliateLinkOverrides(nextOverrides); // Revert listing URL replacement.

    return {
      ...item,
      status: "rolled_back",
      activeListingUrl: item.merchantUrl,
      updatedAt: new Date().toISOString(),
      auditTrail: [
        ...item.auditTrail,
        createAuditEntry({
          action: "rollback_applied",
          actor: "manual",
          note: reason,
        }),
      ],
    };
  });
};

/**
 * Resolve the active affiliate URL for a submission listing.
 */
export const resolveSubmissionAffiliateUrl = ({
  submissionQueueId,
  fallbackUrl,
}: {
  submissionQueueId: string;
  fallbackUrl: string;
}) => {
  const overrides = readAffiliateLinkOverrides();
  return overrides[submissionQueueId] || fallbackUrl;
};

/**
 * Build an agent-friendly snapshot for pending mint jobs.
 */
export const buildAffiliateMintQueueSnapshot = () => ({
  generatedAt: new Date().toISOString(),
  pendingCount: getPendingAffiliateMintQueue().length,
  items: getPendingAffiliateMintQueue(),
});
