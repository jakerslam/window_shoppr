"use client";

export type ModerationCommandAction =
  | "approve_submission"
  | "reject_submission"
  | "resolve_report"
  | "takedown_listing"
  | "takedown_comment"
  | "ban_user"
  | "unban_user";

export type ModerationCommand = {
  id: string;
  action: ModerationCommandAction;
  targetId: string;
  actor: "agent" | "admin";
  createdAt: string;
  reason?: string;
};

export type ModerationAuditEvent = {
  command: ModerationCommand;
  hash: string;
  previousHash: string;
};

/**
 * Build a deterministic pseudo-hash for immutable audit chaining.
 */
const makeHash = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(36)}`;
};

/**
 * Append moderation command to immutable audit chain.
 */
export const toModerationAuditEvent = (
  command: ModerationCommand,
  previousHash: string,
): ModerationAuditEvent => {
  const hash = makeHash(
    `${previousHash}|${command.id}|${command.action}|${command.targetId}|${command.actor}|${command.createdAt}|${command.reason ?? ""}`,
  );
  return { command, hash, previousHash };
};
