import { requestDataApi } from "@/shared/lib/platform/data-api";
import { AuthRole, AuthSession } from "@/shared/lib/platform/auth-session";
import { resolveSessionRoles } from "@/shared/lib/platform/auth/authorization";

export type PrivilegedAuditStatus = "allowed" | "denied";

export type PrivilegedAuditEntry = {
  id: string;
  at: string;
  action: string;
  status: PrivilegedAuditStatus;
  actorRoles: AuthRole[];
  actorEmail?: string;
  metadata?: Record<string, unknown>;
};

const PRIVILEGED_AUDIT_STORAGE_KEY = "window_shoppr_privileged_audit_log";
const MAX_AUDIT_ITEMS = 500;

/**
 * Read privileged audit records from local storage.
 */
export const readPrivilegedAuditLog = (): PrivilegedAuditEntry[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PRIVILEGED_AUDIT_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PrivilegedAuditEntry[]) : [];
  } catch {
    return [];
  }
};

/**
 * Persist privileged audit records to local storage.
 */
const writePrivilegedAuditLog = (records: PrivilegedAuditEntry[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PRIVILEGED_AUDIT_STORAGE_KEY,
      JSON.stringify(records.slice(-MAX_AUDIT_ITEMS)),
    );
  } catch {
    // Ignore storage write failures.
  }
};

/**
 * Emit and persist an audit record for privileged operations.
 */
export const logPrivilegedAuditEvent = async ({
  action,
  status,
  session,
  metadata,
}: {
  action: string;
  status: PrivilegedAuditStatus;
  session: AuthSession | null;
  metadata?: Record<string, unknown>;
}) => {
  const entry: PrivilegedAuditEntry = {
    id: `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    action,
    status,
    actorRoles: resolveSessionRoles(session),
    actorEmail: session?.email,
    metadata,
  };

  const previous = readPrivilegedAuditLog();
  writePrivilegedAuditLog([...previous, entry]);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:audit", { detail: entry }));
  }

  await requestDataApi({
    path: "/data/auth/audit",
    method: "POST",
    body: { entry },
  });
};
