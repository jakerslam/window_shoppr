import { LocalAuthAccount } from "@/shared/lib/platform/auth/types";

const AUTH_ACCOUNTS_STORAGE_KEY = "window_shoppr_auth_accounts"; // Local fallback account store for static deployments.

/**
 * Normalize user email addresses for stable account lookups.
 */
export const normalizeEmail = (value: string) => value.trim().toLowerCase();

/**
 * Read local fallback auth accounts from storage.
 */
export const readLocalAuthAccounts = (): LocalAuthAccount[] => {
  if (typeof window === "undefined") {
    return []; // Skip storage access during SSR.
  }

  try {
    const raw = window.localStorage.getItem(AUTH_ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      return []; // Return empty store when nothing is persisted.
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LocalAuthAccount[]) : [];
  } catch {
    return []; // Ignore parse errors and treat as empty.
  }
};

/**
 * Persist local fallback auth accounts to storage.
 */
export const writeLocalAuthAccounts = (accounts: LocalAuthAccount[]) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  try {
    window.localStorage.setItem(AUTH_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage failures to keep auth flow non-blocking.
  }
};

/**
 * Build a deterministic local account id.
 */
export const buildLocalAccountId = () =>
  `acct_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
