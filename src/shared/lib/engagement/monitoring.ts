"use client";

import { PUBLIC_ENV } from "@/shared/lib/platform/env";
import { reportErrorEvent } from "@/shared/lib/engagement/error-reporting";

type MonitoringErrorType =
  | "window_error"
  | "unhandled_rejection"
  | "react_error_boundary";

type MonitoringTraceType = "initial_navigation" | "route_transition" | "uptime_check";

type MonitoringLogLevel = "info" | "warn" | "error";

type MonitoringBaseEvent = {
  requestId: string;
  pathname: string;
  timestamp: string;
};

type MonitoringErrorEvent = MonitoringBaseEvent & {
  type: MonitoringErrorType;
  message: string;
  stack?: string;
  digest?: string;
};

type MonitoringTraceEvent = MonitoringBaseEvent & {
  type: MonitoringTraceType;
  durationMs: number;
  metadata?: Record<string, number | string | boolean>;
};

type MonitoringStructuredLog = MonitoringBaseEvent & {
  level: MonitoringLogLevel;
  message: string;
  eventType: string;
  metadata?: Record<string, unknown>;
};

const COOKIE_CONSENT_MODE_KEY = "window_shoppr_cookie_mode"; // Matches cookie-consent storage mode key.
const COOKIE_CONSENT_ALL_VALUE = "all"; // Monitoring only runs when analytics consent is granted.
const ERROR_STORAGE_KEY = "window_shoppr_monitoring_errors"; // Rolling local store for captured runtime errors.
const TRACE_STORAGE_KEY = "window_shoppr_monitoring_traces"; // Rolling local store for captured perf traces.
const LOG_STORAGE_KEY = "window_shoppr_monitoring_logs"; // Rolling local store for structured observability logs.
const MAX_HISTORY = 250; // Cap local history size to avoid unbounded storage growth.

/**
 * Build a request correlation id for monitoring envelopes.
 */
const createRequestId = () =>
  `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Check whether analytics/monitoring storage is allowed.
 */
const hasMonitoringConsent = () => {
  if (typeof window === "undefined") {
    return false; // Skip consent reads during SSR.
  }

  return (
    window.localStorage.getItem(COOKIE_CONSENT_MODE_KEY) ===
    COOKIE_CONSENT_ALL_VALUE
  ); // Respect "essential only" users.
};

/**
 * Persist a monitoring record locally in a bounded queue.
 */
const appendStoredRecord = (storageKey: string, record: unknown) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  try {
    const raw = window.localStorage.getItem(storageKey) ?? "[]";
    const parsed = JSON.parse(raw) as unknown;
    const history = Array.isArray(parsed) ? parsed : [];
    const nextHistory = [...history, record].slice(-MAX_HISTORY);
    window.localStorage.setItem(storageKey, JSON.stringify(nextHistory)); // Keep a local debugging trail.
  } catch {
    // Swallow storage errors to avoid breaking user flows.
  }
};

/**
 * Emit a structured log record to local storage and dev console.
 */
const logStructuredMonitoringEvent = (entry: MonitoringStructuredLog) => {
  appendStoredRecord(LOG_STORAGE_KEY, entry);

  if (process.env.NODE_ENV !== "production") {
    const method = entry.level === "error" ? console.error : entry.level === "warn" ? console.warn : console.info;
    method("[observability]", entry);
  }
};

/**
 * Optionally forward monitoring payloads to a remote endpoint when configured.
 */
const dispatchMonitoringEnvelope = (
  kind: "error" | "trace" | "log",
  payload: MonitoringErrorEvent | MonitoringTraceEvent | MonitoringStructuredLog,
) => {
  if (typeof window === "undefined") {
    return; // Skip network dispatch during SSR.
  }

  const endpoint = PUBLIC_ENV.monitoringApiUrl;
  if (!endpoint) {
    return; // Keep local-only mode when no backend endpoint is configured.
  }

  try {
    const body = JSON.stringify({
      kind,
      payload,
      source: "window-shoppr-web",
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob); // Best-effort async delivery without blocking navigation.
      return;
    }

    void fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }); // Fallback delivery when sendBeacon is unavailable.
  } catch {
    // Keep monitoring non-blocking even when network dispatch fails.
  }
};

/**
 * Capture a runtime error signal for local monitoring and optional forwarding.
 */
export const trackMonitoringError = (payload: {
  type: MonitoringErrorType;
  message: string;
  stack?: string;
  digest?: string;
  pathname?: string;
}) => {
  if (typeof window === "undefined") {
    return; // Skip runtime tracking during SSR.
  }

  if (!hasMonitoringConsent()) {
    return; // Respect cookie-consent mode.
  }

  const requestId = createRequestId();
  const pathname = payload.pathname || window.location.pathname;
  const timestamp = new Date().toISOString();

  const event: MonitoringErrorEvent = {
    requestId,
    type: payload.type,
    message: payload.message.slice(0, 800),
    stack: payload.stack?.slice(0, 6000),
    digest: payload.digest,
    pathname,
    timestamp,
  };

  appendStoredRecord(ERROR_STORAGE_KEY, event); // Persist errors for local diagnostics.
  dispatchMonitoringEnvelope("error", event); // Forward to remote monitoring when configured.
  window.dispatchEvent(new CustomEvent("monitoring:error", { detail: event })); // Expose event for future observability bridges.
  reportErrorEvent({
    level: "error",
    message: event.message,
    pathname: event.pathname,
    metadata: {
      type: event.type,
      digest: event.digest,
      hasStack: Boolean(event.stack),
      requestId,
    },
  }); // Forward normalized errors to Sentry-compatible adapter when configured.

  const structuredLog: MonitoringStructuredLog = {
    requestId,
    pathname,
    timestamp,
    level: "error",
    message: event.message,
    eventType: event.type,
    metadata: {
      digest: event.digest,
      hasStack: Boolean(event.stack),
    },
  };
  logStructuredMonitoringEvent(structuredLog);
  dispatchMonitoringEnvelope("log", structuredLog);
};

/**
 * Capture a performance trace signal for local monitoring and optional forwarding.
 */
export const trackMonitoringTrace = (payload: {
  type: MonitoringTraceType;
  pathname?: string;
  durationMs: number;
  metadata?: Record<string, number | string | boolean>;
}) => {
  if (typeof window === "undefined") {
    return; // Skip runtime tracking during SSR.
  }

  if (!hasMonitoringConsent()) {
    return; // Respect cookie-consent mode.
  }

  const requestId = createRequestId();
  const pathname = payload.pathname || window.location.pathname;
  const timestamp = new Date().toISOString();

  const event: MonitoringTraceEvent = {
    requestId,
    type: payload.type,
    pathname,
    durationMs: Number.isFinite(payload.durationMs)
      ? Math.max(0, Number(payload.durationMs.toFixed(2)))
      : 0,
    timestamp,
    metadata: payload.metadata,
  };

  appendStoredRecord(TRACE_STORAGE_KEY, event); // Persist traces for local diagnostics.
  dispatchMonitoringEnvelope("trace", event); // Forward to remote monitoring when configured.
  window.dispatchEvent(new CustomEvent("monitoring:trace", { detail: event })); // Expose event for future observability bridges.

  const structuredLog: MonitoringStructuredLog = {
    requestId,
    pathname,
    timestamp,
    level: "info",
    message: `Trace ${event.type} completed in ${event.durationMs}ms`,
    eventType: event.type,
    metadata: {
      durationMs: event.durationMs,
      ...event.metadata,
    },
  };
  logStructuredMonitoringEvent(structuredLog);
  dispatchMonitoringEnvelope("log", structuredLog);
};
