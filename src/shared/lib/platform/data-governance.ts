"use client";

export type DataRetentionRule = {
  storageKey: string;
  retentionDays: number;
  purpose: "analytics" | "personalization" | "moderation" | "auth" | "ops";
  requiresConsent: boolean;
};

const DAY_MS = 1000 * 60 * 60 * 24;

export const DATA_RETENTION_RULES: DataRetentionRule[] = [
  { storageKey: "window_shoppr_search_events", retentionDays: 90, purpose: "analytics", requiresConsent: true },
  { storageKey: "window_shoppr_affiliate_clicks", retentionDays: 90, purpose: "analytics", requiresConsent: true },
  { storageKey: "window_shoppr_wishlist_events", retentionDays: 90, purpose: "analytics", requiresConsent: true },
  { storageKey: "window_shoppr_monitoring_errors", retentionDays: 30, purpose: "ops", requiresConsent: true },
  { storageKey: "window_shoppr_monitoring_traces", retentionDays: 30, purpose: "ops", requiresConsent: true },
  { storageKey: "window_shoppr_monitoring_logs", retentionDays: 30, purpose: "ops", requiresConsent: true },
  { storageKey: "window_shoppr_reports", retentionDays: 180, purpose: "moderation", requiresConsent: false },
  { storageKey: "window_shoppr_report_queue", retentionDays: 180, purpose: "moderation", requiresConsent: false },
  { storageKey: "window_shoppr_deal_submissions", retentionDays: 365, purpose: "moderation", requiresConsent: false },
  { storageKey: "window_shoppr_deal_submission_queue", retentionDays: 365, purpose: "moderation", requiresConsent: false },
  { storageKey: "window_shoppr_purchase_intents", retentionDays: 180, purpose: "analytics", requiresConsent: true },
  { storageKey: "window_shoppr_purchase_followups", retentionDays: 90, purpose: "analytics", requiresConsent: true },
  { storageKey: "window_shoppr_review_reminders", retentionDays: 90, purpose: "analytics", requiresConsent: true },
  { storageKey: "window_shoppr_auth_session", retentionDays: 14, purpose: "auth", requiresConsent: false },
  { storageKey: "window_shoppr_auth_accounts", retentionDays: 365, purpose: "auth", requiresConsent: false },
];

/**
 * Export a local-first user data bundle for portability requests.
 */
export const exportUserDataBundle = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const bundle: Record<string, unknown> = {};
  for (const { storageKey } of DATA_RETENTION_RULES) {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      continue;
    }

    try {
      bundle[storageKey] = JSON.parse(raw);
    } catch {
      bundle[storageKey] = raw;
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: bundle,
  };
};

/**
 * Delete local-first user data keys for account deletion flows.
 */
export const deleteUserDataBundle = () => {
  if (typeof window === "undefined") {
    return;
  }

  for (const { storageKey } of DATA_RETENTION_RULES) {
    window.localStorage.removeItem(storageKey);
  }

  window.dispatchEvent(new CustomEvent("data-governance:delete"));
};

/**
 * Prune expired local records using retention rules and timestamp fields.
 */
export const pruneExpiredGovernanceData = () => {
  if (typeof window === "undefined") {
    return;
  }

  const now = Date.now();
  for (const rule of DATA_RETENTION_RULES) {
    const raw = window.localStorage.getItem(rule.storageKey);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        continue;
      }

      const cutoff = now - rule.retentionDays * DAY_MS;
      const next = parsed.filter((entry) => {
        if (!entry || typeof entry !== "object") {
          return false;
        }

        const objectEntry = entry as Record<string, unknown>;
        const timestamp =
          typeof objectEntry.timestamp === "string"
            ? objectEntry.timestamp
            : typeof objectEntry.createdAt === "string"
              ? objectEntry.createdAt
              : typeof objectEntry.at === "string"
                ? objectEntry.at
                : null;
        if (!timestamp) {
          return true;
        }

        const time = new Date(timestamp).getTime();
        if (!Number.isFinite(time)) {
          return false;
        }

        return time >= cutoff;
      });

      window.localStorage.setItem(rule.storageKey, JSON.stringify(next));
    } catch {
      // Ignore malformed storage values.
    }
  }
};
