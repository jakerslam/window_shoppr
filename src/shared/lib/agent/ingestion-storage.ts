"use client";

export type AgentQueueRecord<TAction extends string, TPayload> = {
  id: string;
  action: TAction;
  payload: TPayload;
  idempotencyKey: string;
  receivedAt: string;
};

const MAX_QUEUE_SIZE = 500; // Prevent unbounded queue growth in local storage.

export const AGENT_UPSERT_QUEUE_KEY = "window_shoppr_agent_upsert_queue";
export const AGENT_PUBLISH_QUEUE_KEY = "window_shoppr_agent_publish_queue";
export const AGENT_MODERATION_QUEUE_KEY = "window_shoppr_agent_moderation_queue";
export const AGENT_SIGNAL_QUEUE_KEY = "window_shoppr_agent_signal_queue";

/**
 * Read a local stub queue from storage.
 */
export const readQueue = <T>(key: string): T[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

/**
 * Write a bounded local stub queue to storage.
 */
export const writeQueue = (key: string, queue: unknown[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)));
  } catch {
    // Ignore storage failures to keep caller flows non-blocking.
  }
};

/**
 * Generate a queue id with action prefix.
 */
export const createQueueId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
