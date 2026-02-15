import { requestAuthApi } from "@/shared/lib/platform/auth/api";
import { normalizeEmail, readLocalAuthAccounts, writeLocalAuthAccounts } from "@/shared/lib/platform/auth/local-accounts";
import { AuthActionResult } from "@/shared/lib/platform/auth/types";
import { readAuthSession, writeAuthSession } from "@/shared/lib/platform/auth-session";

/**
 * Persist account profile updates into the local auth session.
 */
const persistProfileSession = ({
  provider,
  email,
  displayName,
  marketingEmails,
}: {
  provider: "email" | "google" | "x" | "meta";
  email?: string;
  displayName?: string;
  marketingEmails?: boolean;
}): AuthActionResult => {
  writeAuthSession({ provider, email, displayName, marketingEmails });
  const session = readAuthSession();
  if (!session) {
    return { ok: false, message: "Unable to persist updated account settings." };
  }

  return { ok: true, session, source: "local" };
};

/**
 * Update account profile fields for the active session (API first, local fallback).
 */
export const updateAccountProfile = async ({
  displayName,
  marketingEmails,
}: {
  displayName?: string;
  marketingEmails?: boolean;
}): Promise<AuthActionResult> => {
  const currentSession = readAuthSession();
  if (!currentSession) {
    return { ok: false, message: "Sign in to manage account settings." };
  }

  const apiResult = await requestAuthApi({
    path: "/auth/account",
    method: "PATCH",
    body: {
      displayName,
      marketingEmails,
    },
  });
  if (apiResult) {
    return apiResult;
  }

  const nextDisplayName = displayName?.trim() || currentSession.displayName;
  const nextMarketingEmails =
    marketingEmails ?? currentSession.marketingEmails ?? false;
  const nextEmail = currentSession.email ? normalizeEmail(currentSession.email) : undefined;

  if (nextEmail) {
    const accounts = readLocalAuthAccounts();
    const nextAccounts = accounts.map((account) => {
      if (account.email !== nextEmail) {
        return account;
      }

      return {
        ...account,
        displayName: nextDisplayName,
        marketingEmails: nextMarketingEmails,
        updatedAt: new Date().toISOString(),
      };
    });
    writeLocalAuthAccounts(nextAccounts);
  }

  return persistProfileSession({
    provider: currentSession.provider,
    email: currentSession.email,
    displayName: nextDisplayName,
    marketingEmails: nextMarketingEmails,
  });
};
