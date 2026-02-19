import { AuthRole, AuthSession, readAuthSession } from "@/shared/lib/platform/auth-session";

const PRIVILEGED_ROLE_SET: ReadonlySet<AuthRole> = new Set(["agent", "admin"]);

/**
 * Resolve session roles with backward-compatible defaults.
 */
export const resolveSessionRoles = (session: AuthSession | null) =>
  session?.roles && session.roles.length > 0 ? session.roles : (["user"] as AuthRole[]);

/**
 * Check whether a session has at least one required role.
 */
export const hasAnyRole = ({
  session,
  requiredRoles,
}: {
  session: AuthSession | null;
  requiredRoles: AuthRole[];
}) => {
  const roles = resolveSessionRoles(session);
  return requiredRoles.some((role) => roles.includes(role));
};

/**
 * Require a privileged session (agent/admin) for sensitive operations.
 */
export const assertPrivilegedSession = ({
  reason,
}: {
  reason: string;
}) => {
  const session = readAuthSession();
  if (!session) {
    throw new Error(`Unauthorized: authenticated session required for ${reason}.`);
  }

  const hasPrivilegedRole = resolveSessionRoles(session).some((role) =>
    PRIVILEGED_ROLE_SET.has(role),
  );
  if (!hasPrivilegedRole) {
    throw new Error(`Forbidden: insufficient role for ${reason}.`);
  }

  return session;
};
