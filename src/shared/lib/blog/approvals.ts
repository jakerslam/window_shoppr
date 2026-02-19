"use client";

import { BlogWorkflowState } from "@/shared/lib/blog/types";

const BLOG_WORKFLOW_AUDIT_KEY = "window_shoppr_blog_workflow_audit";

export type BlogWorkflowAuditRecord = {
  articleId: string;
  fromState: BlogWorkflowState;
  toState: BlogWorkflowState;
  action: "submit_review" | "approve" | "publish";
  actor: "agent" | "admin";
  timestamp: string;
};

/**
 * Persist a workflow audit event for blog state transitions.
 */
export const recordBlogWorkflowAudit = (entry: BlogWorkflowAuditRecord) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.localStorage.getItem(BLOG_WORKFLOW_AUDIT_KEY) ?? "[]";
    const parsed = JSON.parse(raw) as unknown;
    const queue = Array.isArray(parsed) ? parsed : [];
    const next = [...queue, entry].slice(-500);
    window.localStorage.setItem(BLOG_WORKFLOW_AUDIT_KEY, JSON.stringify(next));
  } catch {
    // Ignore audit storage failures in stub mode.
  }
};
