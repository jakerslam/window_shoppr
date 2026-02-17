"use client";

import { PUBLIC_ENV } from "@/shared/lib/platform/env";

type MonitoringErrorType =
  | "window_error"
  | "unhandled_rejection"
  | "react_error_boundary";

type MonitoringTraceType = "initial_navigation" | "route_transition";

type MonitoringErrorEvent = {
  type: MonitoringErrorType;
  message: string;
  stack?: string;
  digest?: string;
  pathname: string;
  timestamp: string;
};

type MonitoringTraceEvent = {
  type: MonitoringTraceType;
  pathname: string;
  durationMs: number;
  timestamp: string;
  metadata?: Record<string, number>;
};

const COOKIE_CONSENT_MODE_KEY = "window_shoppr_cookie_mode"; // Matches cookie-consent storage mode key.
const COOKIE_CONSENT_ALL_VALUE = "all"; // Monitoring only runs when analytics consent is granted.
const ERROR_STORAGE_KEY = "window_shoppr_monitoring_errors"; // Rolling local store for captured runtime errors.
const TRACE_STORAGE_KEY = "window_shoppr_monitoring_traces"; // Rolling local store for captured perf traces.
const MAX_HISTORY = 250; // Cap local history size to avoid unbounded storage growth.

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
 * Optionally forward monitoring payloads to a remote endpoint when configured.
 */
const dispatchMonitoringEnvelope = (
  kind: "error" | "trace",
  payload: MonitoringErrorEvent | MonitoringTraceEvent,
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

  const event: MonitoringErrorEvent = {
    type: payload.type,
    message: payload.message.slice(0, 800),
    stack: payload.stack?.slice(0, 6000),
    digest: payload.digest,
    pathname: payload.pathname || window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  appendStoredRecord(ERROR_STORAGE_KEY, event); // Persist errors for local diagnostics.
  dispatchMonitoringEnvelope("error", event); // Forward to remote monitoring when configured.
  window.dispatchEvent(new CustomEvent("monitoring:error", { detail: event })); // Expose event for future observability bridges.
};

/**
 * Capture a performance trace signal for local monitoring and optional forwarding.
 */
export const trackMonitoringTrace = (payload: {
  type: MonitoringTraceType;
  pathname?: string;
  durationMs: number;
  metadata?: Record<string, number>;
}) => {
  if (typeof window === "undefined") {
    return; // Skip runtime tracking during SSR.
  }

  if (!hasMonitoringConsent()) {
    return; // Respect cookie-consent mode.
  }

  const event: MonitoringTraceEvent = {
    type: payload.type,
    pathname: payload.pathname || window.location.pathname,
    durationMs: Number.isFinite(payload.durationMs)
      ? Math.max(0, Number(payload.durationMs.toFixed(2)))
      : 0,
    timestamp: new Date().toISOString(),
    metadata: payload.metadata,
  };

  appendStoredRecord(TRACE_STORAGE_KEY, event); // Persist traces for local diagnostics.
  dispatchMonitoringEnvelope("trace", event); // Forward to remote monitoring when configured.
  window.dispatchEvent(new CustomEvent("monitoring:trace", { detail: event })); // Expose event for future observability bridges.
};

