"use client";

import { PUBLIC_ENV } from "@/shared/lib/platform/env";

export type ErrorReportingLevel = "error" | "warning" | "info";

export type ErrorReportingEvent = {
  eventId: string;
  level: ErrorReportingLevel;
  message: string;
  pathname: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

const ERROR_REPORTING_STORAGE_KEY = "window_shoppr_error_reporting_events";
const MAX_EVENTS = 300;

/**
 * Resolve Sentry store endpoint from DSN when configured.
 */
const getSentryStoreEndpoint = () => {
  const dsn = PUBLIC_ENV.sentryDsn.trim();
  if (!dsn) {
    return null;
  }

  try {
    const parsed = new URL(dsn);
    const [projectId] = parsed.pathname.replace(/^\//, "").split("/");
    const publicKey = parsed.username;

    if (!projectId || !publicKey) {
      return null;
    }

    return {
      url: `${parsed.protocol}//${parsed.host}/api/${projectId}/store/`,
      publicKey,
    };
  } catch {
    return null;
  }
};

/**
 * Persist reporting events locally for audit/debug support.
 */
const persistErrorReportingEvent = (event: ErrorReportingEvent) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.localStorage.getItem(ERROR_REPORTING_STORAGE_KEY) ?? "[]";
    const parsed = JSON.parse(raw) as unknown;
    const list = Array.isArray(parsed) ? parsed : [];
    const next = [...list, event].slice(-MAX_EVENTS);
    window.localStorage.setItem(ERROR_REPORTING_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Keep non-blocking.
  }
};

/**
 * Forward an event to Sentry-compatible store endpoint when DSN is available.
 */
const dispatchSentryCompatibleEvent = (event: ErrorReportingEvent) => {
  if (typeof window === "undefined") {
    return;
  }

  const endpoint = getSentryStoreEndpoint();
  if (!endpoint) {
    return;
  }

  try {
    const body = JSON.stringify({
      event_id: event.eventId,
      level: event.level,
      message: event.message,
      platform: "javascript",
      timestamp: Math.floor(new Date(event.timestamp).getTime() / 1000),
      tags: {
        app: "window-shoppr-web",
      },
      extra: {
        pathname: event.pathname,
        ...event.metadata,
      },
    });

    const authHeader = `Sentry sentry_version=7, sentry_key=${endpoint.publicKey}, sentry_client=window-shoppr/1.0`;

    void fetch(endpoint.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sentry-auth": authHeader,
      },
      body,
      keepalive: true,
    });
  } catch {
    // Keep non-blocking.
  }
};

/**
 * Capture and forward a normalized error-reporting event.
 */
export const reportErrorEvent = (payload: {
  level: ErrorReportingLevel;
  message: string;
  pathname: string;
  metadata?: Record<string, unknown>;
}) => {
  const event: ErrorReportingEvent = {
    eventId: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    level: payload.level,
    message: payload.message.slice(0, 1000),
    pathname: payload.pathname,
    timestamp: new Date().toISOString(),
    metadata: payload.metadata,
  };

  persistErrorReportingEvent(event);
  dispatchSentryCompatibleEvent(event);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("monitoring:report", { detail: event }));
  }
};
