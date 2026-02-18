import { PUBLIC_ENV } from "@/shared/lib/platform/env";
import {
  AffiliateMintAuditEntry,
  AffiliateMintQueueItem,
} from "@/shared/lib/engagement/affiliate-minting-storage";
import {
  BLOCKED_SIGNAL_HOST_HINTS,
  KNOWN_AFFILIATE_HOST_HINTS,
} from "@/shared/lib/engagement/affiliate-minting/constants";

/**
 * Normalize and validate a merchant product URL.
 */
export const normalizeMerchantUrl = (value: string) => {
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
export const createMintQueueId = () =>
  `amq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Build a single audit entry with consistent timestamp fields.
 */
export const createAuditEntry = ({
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
export const buildAutoAffiliateCandidate = (merchantUrl: string) => {
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
export const validateMintCompliance = ({
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
 * Build an agent-friendly snapshot for pending mint jobs.
 */
export const buildAffiliateMintQueueSnapshot = ({
  pendingItems,
}: {
  pendingItems: AffiliateMintQueueItem[];
}) => ({
  generatedAt: new Date().toISOString(),
  pendingCount: pendingItems.length,
  items: pendingItems,
});
