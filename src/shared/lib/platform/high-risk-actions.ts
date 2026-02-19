"use client";

import { readAuthSession } from "@/shared/lib/platform/auth-session";

export type HighRiskAction =
  | "admin.ban_user"
  | "admin.unban_user"
  | "admin.takedown_listing"
  | "admin.takedown_comment"
  | "agent.publish_listing"
  | "agent.resolve_moderation";

export type HighRiskApprovalMode = "two_step" | "approval_required";

export type HighRiskPolicy = {
  action: HighRiskAction;
  mode: HighRiskApprovalMode;
  requiresAudit: true;
};

const HIGH_RISK_POLICIES: Record<HighRiskAction, HighRiskPolicy> = {
  "admin.ban_user": { action: "admin.ban_user", mode: "two_step", requiresAudit: true },
  "admin.unban_user": { action: "admin.unban_user", mode: "two_step", requiresAudit: true },
  "admin.takedown_listing": {
    action: "admin.takedown_listing",
    mode: "approval_required",
    requiresAudit: true,
  },
  "admin.takedown_comment": {
    action: "admin.takedown_comment",
    mode: "approval_required",
    requiresAudit: true,
  },
  "agent.publish_listing": {
    action: "agent.publish_listing",
    mode: "approval_required",
    requiresAudit: true,
  },
  "agent.resolve_moderation": {
    action: "agent.resolve_moderation",
    mode: "approval_required",
    requiresAudit: true,
  },
};

/**
 * Resolve policy for a high-risk action.
 */
export const getHighRiskPolicy = (action: HighRiskAction) =>
  HIGH_RISK_POLICIES[action];

/**
 * Gate high-risk actions to admin/agent-capable sessions only.
 */
export const canExecuteHighRiskAction = (action: HighRiskAction) => {
  const session = readAuthSession();
  if (!session) {
    return false;
  }

  const policy = getHighRiskPolicy(action);
  if (!policy) {
    return false;
  }

  return (
    session.roles.includes("admin") ||
    (session.roles.includes("agent") && action.startsWith("agent."))
  );
};
