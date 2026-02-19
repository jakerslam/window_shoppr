"use client";

import { reportErrorEvent } from "@/shared/lib/engagement/error-reporting";
import { readAuthSession } from "@/shared/lib/platform/auth-session";

type RateLimitOptions = {
  action: string;
  windowMs: number;
  maxRequests: number;
  cooldownMs: number;
  idempotencyKey?: string;
};

type RateLimitState = {
  timestamps: number[];
  cooldownUntil: number;
  idempotency: Record<string, number>;
};

export type RateLimitResult = {
  ok: true;
} | {
  ok: false;
  statusCode: 429;
  retryAfterMs: number;
  message: string;
};

const RATE_LIMIT_STORAGE_KEY = "window_shoppr_rate_limits";
const MAX_IDEMPOTENCY_KEYS = 40;
const DEFAULT_IDEMPOTENCY_TTL_MS = 1000 * 60 * 5;

/**
 * Build a stable actor identifier from auth session and browser fallback.
 */
const getActorId = () => {
  if (typeof window === "undefined") {
    return "actor:ssr";
  }

  const session = readAuthSession();
  if (session?.sessionId) {
    return `session:${session.sessionId}`;
  }

  const fallbackKey = "window_shoppr_rate_limit_actor";
  const existing = window.localStorage.getItem(fallbackKey);
  if (existing) {
    return `anon:${existing}`;
  }

  const generated = `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(fallbackKey, generated);
  return `anon:${generated}`;
};

/**
 * Parse bounded local storage state for per-action rate limits.
 */
const readRateLimitStore = (): Record<string, RateLimitState> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed as Record<string, RateLimitState>;
  } catch {
    return {};
  }
};

/**
 * Persist local storage state for per-action rate limits.
 */
const writeRateLimitStore = (store: Record<string, RateLimitState>) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage failures to keep interaction non-blocking.
  }
};

/**
 * Add a warning event for abuse violations to local monitoring/reporting.
 */
const trackRateLimitViolation = ({
  action,
  retryAfterMs,
}: {
  action: string;
  retryAfterMs: number;
}) => {
  if (typeof window === "undefined") {
    return;
  }

  const pathname = window.location.pathname || "/";
  reportErrorEvent({
    level: "warning",
    message: `Rate limit exceeded for ${action}`,
    pathname,
    metadata: {
      action,
      retryAfterMs,
      source: "abuse_guard",
    },
  });
};

/**
 * Enforce local-first write throttles with cooldown and idempotency support.
 */
export const consumeRateLimit = ({
  action,
  windowMs,
  maxRequests,
  cooldownMs,
  idempotencyKey,
}: RateLimitOptions): RateLimitResult => {
  if (typeof window === "undefined") {
    return { ok: true };
  }

  const now = Date.now();
  const actorId = getActorId();
  const store = readRateLimitStore();
  const storeKey = `${action}:${actorId}`;
  const state = store[storeKey] ?? {
    timestamps: [],
    cooldownUntil: 0,
    idempotency: {},
  };

  const timestamps = state.timestamps.filter((timestamp) => now - timestamp < windowMs);
  const idempotency = Object.fromEntries(
    Object.entries(state.idempotency).filter(([, createdAt]) => now - createdAt < DEFAULT_IDEMPOTENCY_TTL_MS),
  );

  if (idempotencyKey && idempotency[idempotencyKey]) {
    store[storeKey] = { ...state, timestamps, idempotency };
    writeRateLimitStore(store);
    return { ok: true };
  }

  if (state.cooldownUntil > now) {
    const retryAfterMs = state.cooldownUntil - now;
    store[storeKey] = { ...state, timestamps, idempotency };
    writeRateLimitStore(store);
    trackRateLimitViolation({ action, retryAfterMs });
    return {
      ok: false,
      statusCode: 429,
      retryAfterMs,
      message: `Too many requests. Try again in ${Math.ceil(retryAfterMs / 1000)}s.`,
    };
  }

  if (timestamps.length >= maxRequests) {
    const cooldownUntil = now + cooldownMs;
    store[storeKey] = {
      timestamps,
      cooldownUntil,
      idempotency,
    };
    writeRateLimitStore(store);

    const retryAfterMs = cooldownMs;
    trackRateLimitViolation({ action, retryAfterMs });
    return {
      ok: false,
      statusCode: 429,
      retryAfterMs,
      message: `Too many requests. Try again in ${Math.ceil(retryAfterMs / 1000)}s.`,
    };
  }

  const nextTimestamps = [...timestamps, now];
  if (idempotencyKey) {
    idempotency[idempotencyKey] = now;
  }

  const limitedEntries = Object.entries(idempotency).slice(-MAX_IDEMPOTENCY_KEYS);
  store[storeKey] = {
    timestamps: nextTimestamps,
    cooldownUntil: 0,
    idempotency: Object.fromEntries(limitedEntries),
  };
  writeRateLimitStore(store);
  return { ok: true };
};
